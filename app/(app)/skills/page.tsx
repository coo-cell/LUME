import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import type { SkillLevel } from "@/lib/types/database";

const LEVEL_LABEL: Record<SkillLevel, string> = {
  discovered: "Щойно відкрито",
  growing: "Зростає",
  experienced: "Досвідчений",
  master: "Майстер",
};

const CONTEXT_LABEL: Record<string, string> = {
  work: "Робота",
  leadership: "Лідерство",
  creative: "Творче",
  personal: "Особисте",
};

// Distinct-context thresholds: 1 / 2-3 / 5-6 / 8+. Progress bar fills toward
// the next breakpoint, not the final master.
function progressToNext(count: number): { value: number; nextLabel: string } {
  if (count >= 8) return { value: 100, nextLabel: "Майстер" };
  if (count >= 5)
    return { value: Math.min(100, ((count - 4) / 4) * 100), nextLabel: "Майстер" };
  if (count >= 2)
    return {
      value: Math.min(100, ((count - 1) / 4) * 100),
      nextLabel: "Досвідчений",
    };
  return { value: (count / 2) * 100, nextLabel: "Зростає" };
}

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
    .order("confirmation_count", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Карта скілів</h1>
          <p className="text-sm text-muted-foreground">
            Тільки ті скіли, які ти підтвердив сам через події в архіві.
          </p>
        </div>
        {skills && skills.length > 0 && (
          <Button asChild>
            <Link href="/skills/new">+ Додати подію</Link>
          </Button>
        )}
      </header>

      {skills && skills.length > 0 ? (
        <ul className="space-y-3">
          {skills.map((s) => {
            const { value, nextLabel } = progressToNext(s.confirmation_count);
            return (
              <li key={s.id} className="space-y-2 rounded-md border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-base font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {LEVEL_LABEL[s.level]}
                  </span>
                </div>
                <Progress value={value} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {s.context_tag && CONTEXT_LABEL[s.context_tag]
                      ? CONTEXT_LABEL[s.context_tag]
                      : s.context_tag}{" "}
                    · {s.confirmation_count}{" "}
                    {s.confirmation_count === 1 ? "контекст" : "контекстів"}
                  </span>
                  {s.level !== "master" && (
                    <span>До «{nextLabel}»</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Поки порожньо
              </h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Опиши момент, де ти пишався результатом — ми витягнемо звідти
                твої скіли. Принцип дзеркала: тільки те, що ти сам показав, без
                здогадок.
              </p>
            </div>
            <Button asChild>
              <Link href="/skills/new">Додати першу подію</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
