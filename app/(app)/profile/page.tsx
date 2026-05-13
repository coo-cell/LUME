import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Про тебе</h1>
        <p className="text-sm text-muted-foreground">
          Те, що ми помітили у твоїх відповідях. Це робоча гіпотеза — буде
          уточнюватись з кожним модулем.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ціль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Що хочеш навчитись" value={profile.goal_description} />
          <Row label="Домен" value={profile.goal_domain} />
          <Row
            label="Часу на тиждень"
            value={
              profile.weekly_time_minutes
                ? `${profile.weekly_time_minutes} хв`
                : null
            }
          />
          <Row label="Формат" value={profile.content_format} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Мотивація</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Вектор" value={profile.motivation_vector} />
          <Row label="Джерело енергії" value={profile.energy_source} />
          <Row
            label="Автономність (1–5)"
            value={profile.autonomy_level?.toString() ?? null}
          />
          <Row label="Горизонт мислення" value={profile.time_horizon} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Когнітивний стиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row
            label="Глибина / широта (1–5)"
            value={profile.depth_vs_breadth?.toString() ?? null}
          />
          <Row
            label="Толерантність до неоднозначності (1–5)"
            value={profile.ambiguity_tolerance?.toString() ?? null}
          />
          <Row label="Стиль обробки" value={profile.processing_style} />
          <Row label="Темп навчання" value={profile.learning_pace} />
        </CardContent>
      </Card>

      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Наступний крок: перший модуль під твою ціль. (Скоро — Спринт 1, Задача 3.)
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-56 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
