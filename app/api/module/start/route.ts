import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { module_id } = (await request.json().catch(() => ({}))) as {
    module_id?: string;
  };
  if (!module_id) {
    return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("modules")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", module_id)
    .eq("user_id", user.id)
    .eq("status", "generated");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
