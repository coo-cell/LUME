import { redirect } from "next/navigation";

import { NewSkillEvent } from "@/components/skills/new-skill-event";
import { createClient } from "@/lib/supabase/server";

export default async function NewSkillEventPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <div className="container max-w-3xl py-8">
      <NewSkillEvent />
    </div>
  );
}
