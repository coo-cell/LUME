import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
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
    <div className="container flex flex-col items-center justify-center gap-8 py-24 text-center">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Персональний план навчання — за твоїм темпом
        </h1>
        <p className="text-lg text-muted-foreground">
          Lume будує програму під твою ціль, темп і стиль. Результат уже цього
          тижня.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button asChild size="lg">
          <Link href="/register">Почати безкоштовно</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          3 000 токенів при реєстрації · Вже маєш акаунт?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
