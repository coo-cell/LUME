import { NextResponse, type NextRequest } from "next/server";

import { CLAUDE_MODEL, createAnthropic } from "@/lib/ai/client";
import {
  ANALYZE_ONBOARDING_SYSTEM,
  ANALYZE_ONBOARDING_TOOL,
  buildAnalyzeOnboardingUserMessage,
  type OnboardingAnalysis,
  type OnboardingInput,
} from "@/lib/ai/prompts/analyze-onboarding";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardAITokens } from "@/lib/tokens/api-guard";
import { charge } from "@/lib/tokens/charge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input: OnboardingInput;
  try {
    input = (await request.json()) as OnboardingInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const guard = await guardAITokens(user.id, "onboarding");
  if (guard) return guard;

  const anthropic = createAnthropic();
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: ANALYZE_ONBOARDING_SYSTEM,
    tools: [ANALYZE_ONBOARDING_TOOL],
    tool_choice: { type: "tool", name: "save_user_profile" },
    messages: [
      { role: "user", content: buildAnalyzeOnboardingUserMessage(input) },
    ],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "Model did not return a tool call" },
      { status: 502 },
    );
  }

  const analysis = toolUse.input as OnboardingAnalysis;

  const admin = createAdminClient();
  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      onboarding_completed: true,
      goal_domain: analysis.goal_domain,
      goal_description: input.goal_dialog.what_to_learn,
      weekly_time_minutes: input.goal_dialog.weekly_time_minutes,
      content_format: input.goal_dialog.content_format,
      motivation_vector: analysis.motivation_vector,
      energy_source: analysis.energy_source,
      autonomy_level: analysis.autonomy_level,
      time_horizon: analysis.time_horizon,
      depth_vs_breadth: analysis.depth_vs_breadth,
      ambiguity_tolerance: analysis.ambiguity_tolerance,
      processing_style: analysis.processing_style,
      learning_pace: analysis.learning_pace,
    })
    .eq("id", user.id);

  if (profileErr) {
    return NextResponse.json(
      { error: "Failed to save profile", detail: profileErr.message },
      { status: 500 },
    );
  }

  const { balanceAfter } = await charge({
    userId: user.id,
    actionType: "onboarding",
  });

  return NextResponse.json({ analysis, balance: balanceAfter });
}
