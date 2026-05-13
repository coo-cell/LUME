import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "../login/login-form";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RegisterPage() {
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

    redirect(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Створити акаунт</CardTitle>
          <CardDescription>
            3 000 безкоштовних токенів на старт. Перший модуль під твою ціль —
            одразу після онбордингу.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm label="Зареєструватись через Google" next="/onboarding" />
          <p className="text-xs text-muted-foreground">
            Вже є акаунт?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Увійти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
