import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const hasModules = (modules?.length ?? 0) > 0;

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Привіт 👋</h1>
        {profile?.goal_description && (
          <p className="text-sm text-muted-foreground">
            Ціль: {profile.goal_description}
          </p>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Сьогодні</CardTitle>
          <CardDescription>
            {hasModules
              ? "Продовж там, де зупинився."
              : "Перший модуль готується після онбордингу — скоро з'явиться тут."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasModules ? (
            <ul className="space-y-2">
              {modules!.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/module/${m.id}`}
                    className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{m.title ?? "Модуль"}</span>
                    <span className="text-xs text-muted-foreground">{m.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Нічого ще немає. Перевір <Link href="/profile" className="underline">профіль</Link> поки модуль готується.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Скіли</CardTitle>
            <CardDescription>
              Карта з'явиться після того, як додаси першу подію в архів.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/skills" className="text-sm underline underline-offset-4">
              Відкрити
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Профіль</CardTitle>
            <CardDescription>
              Те, що ми помітили в твоїх відповідях. Уточнюється з кожним модулем.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile" className="text-sm underline underline-offset-4">
              Подивитись
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
