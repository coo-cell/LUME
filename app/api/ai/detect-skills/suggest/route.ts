import { NextResponse } from "next/server";

import { CLAUDE_MODEL, createAnthropic } from "@/lib/ai/client";
import {
  DETECT_SKILLS_SUGGEST_SYSTEM,
  DETECT_SKILLS_SUGGEST_TOOL,
  buildSuggestUserMessage,
  type SkillSuggestion,
} from "@/lib/ai/prompts/detect-skills";
import { createClient } from "@/lib/supabase/server";
import {
  TOKEN_COSTS,
  assertBalance,
  InsufficientTokensError,
} from "@/lib/tokens/charge";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_DESCRIPTION_LEN = 80;

interface Body {
  event_description?: string;
  clarifying_answers?: { question: string; answer: string }[];
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const description = body?.event_description?.trim() ?? "";
  const answers = (body?.clarifying_answers ?? [])
    .map((qa) => ({
      question: qa.question?.trim() ?? "",
      answer: qa.answer?.trim() ?? "",
    }))
    .filter((qa) => qa.question && qa.answer);

  if (description.length < MIN_DESCRIPTION_LEN) {
    return NextResponse.json(
      { error: "Опис занадто короткий." },
      { status: 400 },
    );
  }

  // Gate again — charge happens on /api/skills/confirm after user accepts.
  try {
    await assertBalance(user.id, TOKEN_COSTS.skill_detection);
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return NextResponse.json(
        {
          error: "Insufficient tokens",
          balance: err.balance,
          required: err.required,
        },
        { status: 402 },
      );
    }
    throw err;
  }

  const anthropic = createAnthropic();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: DETECT_SKILLS_SUGGEST_SYSTEM,
    tools: [DETECT_SKILLS_SUGGEST_TOOL],
    tool_choice: { type: "tool", name: "suggest_skills" },
    messages: [
      { role: "user", content: buildSuggestUserMessage(description, answers) },
    ],
  });

  const toolUse = message.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "Model did not return a tool call" },
      { status: 502 },
    );
  }

  const { suggested_skills } = toolUse.input as {
    suggested_skills: SkillSuggestion[];
  };

  return NextResponse.json({ suggestions: suggested_skills });
}
