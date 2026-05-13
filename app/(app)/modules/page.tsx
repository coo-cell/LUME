import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ModulesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, status, domain, created_at, completed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Модулі</h1>
        <p className="text-sm text-muted-foreground">
          Всі модулі, які ми згенерували під твою ціль.
        </p>
      </header>

      {modules && modules.length > 0 ? (
        <ul className="space-y-3">
          {modules.map((m) => (
            <li key={m.id}>
              <Link href={`/module/${m.id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader>
                    <CardTitle className="text-base">{m.title ?? "Модуль"}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.domain ?? "—"}</span>
                    <span>{m.status}</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Поки немає модулів. Перший з'явиться після онбордингу.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
