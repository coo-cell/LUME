import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    redirect(profile?.onboarding_completed ? "/profile" : "/onboarding");
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Увійти в Lume</CardTitle>
          <CardDescription>
            Персональний план навчання за 10 хвилин. 3 000 безкоштовних токенів при реєстрації.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <p className="text-xs text-muted-foreground">
            Продовжуючи, ти приймаєш умови і{" "}
            <Link href="/" className="underline underline-offset-4">
              політику конфіденційності
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
