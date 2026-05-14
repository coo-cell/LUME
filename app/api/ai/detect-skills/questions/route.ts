import { NextResponse } from "next/server";

import { CLAUDE_MODEL, createAnthropic } from "@/lib/ai/client";
import {
  DETECT_SKILLS_QUESTIONS_SYSTEM,
  DETECT_SKILLS_QUESTIONS_TOOL,
  buildQuestionsUserMessage,
} from "@/lib/ai/prompts/detect-skills";
import { createClient } from "@/lib/supabase/server";
import { guardAITokens } from "@/lib/tokens/api-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_DESCRIPTION_LEN = 80;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    event_description?: string;
  } | null;
  const description = body?.event_description?.trim() ?? "";
  if (description.length < MIN_DESCRIPTION_LEN) {
    return NextResponse.json(
      { error: "Опис занадто короткий — опиши хоча б у трьох реченнях." },
      { status: 400 },
    );
  }

  // Gate but do not charge yet: keeps user from starting a flow they can't finish.
  const guard = await guardAITokens(user.id, "skill_detection");
  if (guard) return guard;

  const anthropic = createAnthropic();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: DETECT_SKILLS_QUESTIONS_SYSTEM,
    tools: [DETECT_SKILLS_QUESTIONS_TOOL],
    tool_choice: { type: "tool", name: "ask_clarifying_questions" },
    messages: [{ role: "user", content: buildQuestionsUserMessage(description) }],
  });

  const toolUse = message.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "Model did not return a tool call" },
      { status: 502 },
    );
  }

  const { clarifying_questions } = toolUse.input as {
    clarifying_questions: string[];
  };

  return NextResponse.json({ questions: clarifying_questions });
}
