import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PauseResponse } from "@/lib/types/database";

export const runtime = "nodejs";

interface CompleteBody {
  module_id: string;
  pause_responses: PauseResponse[];
  task_completed: boolean;
  reflection: string;
  sources_opened: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CompleteBody;
  try {
    body = (await request.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.module_id || !Array.isArray(body.pause_responses)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Ownership check via RLS would block a missing module too, but explicit is
  // clearer for the 404 vs 403 distinction.
  const { data: module } = await supabase
    .from("modules")
    .select("id, user_id")
    .eq("id", body.module_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { error: progressErr } = await admin.from("module_progress").insert({
    module_id: body.module_id,
    user_id: user.id,
    sources_opened: !!body.sources_opened,
    task_completed: !!body.task_completed,
    reflection_length: body.reflection?.length ?? 0,
    pause_responses: body.pause_responses,
  });
  if (progressErr) {
    return NextResponse.json(
      { error: "Failed to save progress", detail: progressErr.message },
      { status: 500 },
    );
  }

  const { error: moduleErr } = await admin
    .from("modules")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", body.module_id);
  if (moduleErr) {
    return NextResponse.json(
      { error: "Failed to mark complete", detail: moduleErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
