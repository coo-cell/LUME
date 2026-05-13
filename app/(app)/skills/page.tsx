import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const LEVEL_LABEL: Record<string, string> = {
  discovered: "Щойно відкрито",
  growing: "Зростає",
  experienced: "Досвідчений",
  master: "Майстер",
};

export default async function SkillsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: skills } = await supabase
    .from("skills")
    .select("id, name, level, context_tag, confirmation_count")
    .eq("user_id", user.id)
    .order("confirmation_count", { ascending: false });

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Карта скілів</h1>
        <p className="text-sm text-muted-foreground">
          Тільки ті скіли, які ти підтвердив сам через події в архіві. (Принцип
          дзеркала.)
        </p>
      </header>

      {skills && skills.length > 0 ? (
        <ul className="space-y-2">
          {skills.map((s) => (
            <li key={s.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {LEVEL_LABEL[s.level] ?? s.level}
                </span>
              </div>
              {s.context_tag && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.context_tag} · {s.confirmation_count} підтверджень
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Поки порожньо</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Скіли з'являться після того, як ти опишеш першу подію в архіві —
            ситуацію, де пишався результатом. (Спринт 2.)
          </CardContent>
        </Card>
      )}
    </div>
  );
}
