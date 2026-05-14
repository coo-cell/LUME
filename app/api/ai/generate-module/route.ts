import { NextResponse } from "next/server";

import { CLAUDE_MODEL, createAnthropic } from "@/lib/ai/client";
import {
  GENERATE_MODULE_SYSTEM,
  GENERATE_MODULE_TOOL,
  buildGenerateModuleUserMessage,
  type GenerateModuleInput,
} from "@/lib/ai/prompts/generate-module";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { guardAITokens } from "@/lib/tokens/api-guard";
import { TOKEN_COSTS, charge } from "@/lib/tokens/charge";
import type { ModuleContent } from "@/lib/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEDUP_WINDOW_MS = 5 * 60 * 1000;

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "onboarding_completed, goal_domain, goal_description, weekly_time_minutes, content_format, motivation_vector, energy_source, autonomy_level, time_horizon, depth_vs_breadth, ambiguity_tolerance, processing_style, learning_pace",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    return NextResponse.json(
      { error: "Onboarding not completed" },
      { status: 409 },
    );
  }

  if (
    !profile.goal_domain ||
    !profile.goal_description ||
    !profile.motivation_vector ||
    !profile.energy_source ||
    !profile.time_horizon ||
    !profile.processing_style ||
    !profile.learning_pace
  ) {
    return NextResponse.json(
      { error: "Profile is missing fields needed to generate a module" },
      { status: 409 },
    );
  }

  // Dedup: if a recently-created module is still "generated", return it.
  // Protects against double-clicks from /module/generating triggering twice.
  const { data: existing } = await supabase
    .from("modules")
    .select("id, created_at, status")
    .eq("user_id", user.id)
    .in("status", ["generated", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const ageMs = Date.now() - new Date(existing.created_at).getTime();
    if (ageMs < DEDUP_WINDOW_MS) {
      return NextResponse.json({ module_id: existing.id, deduped: true });
    }
  }

  const guard = await guardAITokens(user.id, "module_generation");
  if (guard) return guard;

  const input: GenerateModuleInput = {
    motivation_vector: profile.motivation_vector,
    energy_source: profile.energy_source,
    autonomy_level: profile.autonomy_level ?? 3,
    time_horizon: profile.time_horizon,
    depth_vs_breadth: profile.depth_vs_breadth ?? 3,
    ambiguity_tolerance: profile.ambiguity_tolerance ?? 3,
    processing_style: profile.processing_style,
    learning_pace: profile.learning_pace,
    goal_domain: profile.goal_domain,
    goal_description: profile.goal_description,
    weekly_time_minutes: profile.weekly_time_minutes ?? 60,
    content_format: profile.content_format ?? "text",
  };

  const anthropic = createAnthropic();
  // Streaming call: blocks server until completion but uses Anthropic's stream
  // API so we don't depend on a single large response (also future-friendly if
  // we surface partial UI later).
  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: GENERATE_MODULE_SYSTEM,
    tools: [GENERATE_MODULE_TOOL],
    tool_choice: { type: "tool", name: "save_module" },
    messages: [
      { role: "user", content: buildGenerateModuleUserMessage(input) },
    ],
  });

  const finalMessage = await stream.finalMessage();

  const toolUse = finalMessage.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "Model did not return a tool call" },
      { status: 502 },
    );
  }

  const parsed = toolUse.input as {
    title: string;
    hook: ModuleContent["hook"];
    core: ModuleContent["core"];
    action: ModuleContent["action"];
  };

  const moduleContent: ModuleContent = {
    hook: parsed.hook,
    core: parsed.core,
    action: parsed.action,
  };

  const admin = createAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .from("modules")
    .insert({
      user_id: user.id,
      domain: profile.goal_domain,
      title: parsed.title,
      content: moduleContent,
      tokens_used: TOKEN_COSTS.module_generation,
      status: "generated",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: "Failed to save module", detail: insertErr?.message },
      { status: 500 },
    );
  }

  const { balanceAfter } = await charge({
    userId: user.id,
    actionType: "module_generation",
    referenceId: inserted.id,
  });

  return NextResponse.json({ module_id: inserted.id, balance: balanceAfter });
}
