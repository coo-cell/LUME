import { redirect } from "next/navigation";

import { GeneratingTrigger } from "./generating-trigger";
import { createClient } from "@/lib/supabase/server";

export default async function ModuleGeneratingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, goal_description")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center py-12">
      <GeneratingTrigger goalDescription={profile.goal_description ?? null} />
    </div>
  );
}
