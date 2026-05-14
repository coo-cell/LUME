import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// Placeholder for the post-onboarding "generating module" screen.
// Wires up after Sprint 1 / Task 3 lands /api/ai/generate-module — at that
// point this page will trigger generation, stream progress, and redirect to
// /module/[id].
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
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Готуємо твій перший модуль
            </h1>
            {profile?.goal_description && (
              <p className="text-sm text-muted-foreground">
                Під ціль: {profile.goal_description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Це займе хвилину. Можеш поки оглянути dashboard — модуль з'явиться там автоматично.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Перейти в Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
