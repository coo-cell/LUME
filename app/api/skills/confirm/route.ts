import { NextResponse } from "next/server";

import { levelForCount } from "@/lib/skills/level";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { charge } from "@/lib/tokens/charge";
import type { ClarifyingAnswer, SkillContextTag } from "@/lib/types/database";

export const runtime = "nodejs";

const VALID_CONTEXTS: SkillContextTag[] = [
  "work",
  "personal",
  "creative",
  "leadership",
];

interface ConfirmedSkill {
  name: string;
  context_tag: SkillContextTag;
  evidence: string;
}

interface Body {
  event_description?: string;
  clarifying_answers?: ClarifyingAnswer[];
  confirmed?: ConfirmedSkill[];
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
  const answers = body?.clarifying_answers ?? [];
  const confirmed = (body?.confirmed ?? [])
    .map((s) => ({
      name: s.name?.trim() ?? "",
      context_tag: s.context_tag,
      evidence: s.evidence?.trim() ?? "",
    }))
    .filter(
      (s) =>
        s.name.length > 0 &&
        VALID_CONTEXTS.includes(s.context_tag) &&
        s.evidence.length > 0,
    );

  if (!description) {
    return NextResponse.json(
      { error: "event_description is required" },
      { status: 400 },
    );
  }
  if (confirmed.length === 0) {
    return NextResponse.json(
      { error: "Підтверджених скілів немає." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Charge once for the whole detect-skills flow. If anything below fails the
  // user-facing message will be cryptic but the row is small and re-runnable.
  let chargeRefId: string | null = null;

  const results: {
    skill_id: string;
    name: string;
    context_tag: SkillContextTag;
    level: string;
    confirmation_count: number;
    counted_new_context: boolean;
  }[] = [];

  for (const skill of confirmed) {
    // Find existing skill row by user + exact (trimmed) name.
    const { data: existing } = await admin
      .from("skills")
      .select("id, confirmation_count, level")
      .eq("user_id", user.id)
      .eq("name", skill.name)
      .maybeSingle();

    let skillId: string;

    if (existing) {
      skillId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from("skills")
        .insert({
          user_id: user.id,
          name: skill.name,
          context_tag: skill.context_tag,
          confirmation_count: 0,
          level: "discovered",
        })
        .select("id")
        .single();
      if (insertErr || !inserted) {
        return NextResponse.json(
          { error: "Failed to create skill", detail: insertErr?.message },
          { status: 500 },
        );
      }
      skillId = inserted.id;
    }

    // Insert the skill_event tied to this confirmation.
    const { error: evtErr } = await admin.from("skill_events").insert({
      skill_id: skillId,
      user_id: user.id,
      event_description: description,
      context_type: skill.context_tag,
      evidence: skill.evidence,
      confirmed_by_user: true,
      clarifying_answers: answers,
    });
    if (evtErr) {
      return NextResponse.json(
        { error: "Failed to save skill event", detail: evtErr.message },
        { status: 500 },
      );
    }

    // Recompute confirmation_count = number of DISTINCT context_type values
    // across all confirmed skill_events for this skill. One context = one
    // confirmation, even if the user logs the same context twice.
    const { data: events } = await admin
      .from("skill_events")
      .select("context_type")
      .eq("skill_id", skillId)
      .eq("confirmed_by_user", true);

    const distinctContexts = new Set(
      (events ?? [])
        .map((e) => e.context_type)
        .filter((c): c is string => Boolean(c)),
    );
    const newCount = distinctContexts.size;
    const newLevel = levelForCount(newCount);

    const { error: updErr } = await admin
      .from("skills")
      .update({ confirmation_count: newCount, level: newLevel })
      .eq("id", skillId);
    if (updErr) {
      return NextResponse.json(
        { error: "Failed to update skill level", detail: updErr.message },
        { status: 500 },
      );
    }

    if (!chargeRefId) chargeRefId = skillId;

    results.push({
      skill_id: skillId,
      name: skill.name,
      context_tag: skill.context_tag,
      level: newLevel,
      confirmation_count: newCount,
      counted_new_context: !existing || (existing.confirmation_count ?? 0) < newCount,
    });
  }

  const { balanceAfter } = await charge({
    userId: user.id,
    actionType: "skill_detection",
    referenceId: chargeRefId ?? undefined,
  });

  return NextResponse.json({ skills: results, balance: balanceAfter });
}
