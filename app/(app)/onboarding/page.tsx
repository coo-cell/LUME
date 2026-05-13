import { redirect } from "next/navigation";

import { OnboardingFlow } from "./onboarding-flow";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated requests, but TS doesn't know.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/profile");

  return (
    <div className="container max-w-2xl py-8">
      <OnboardingFlow />
    </div>
  );
}
