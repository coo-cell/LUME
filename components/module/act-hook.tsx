import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ModuleContent } from "@/lib/types/database";

interface Props {
  hook: ModuleContent["hook"];
}

export function ActHook({ hook }: Props) {
  return (
    <section aria-labelledby="hook-heading" className="space-y-3">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Акт 1 · Гачок
        </p>
        <h2 id="hook-heading" className="text-2xl font-semibold tracking-tight">
          {hook.personal_reference}
        </h2>
      </header>
      <Card>
        <CardContent className="whitespace-pre-line pt-6 text-base leading-relaxed">
          {hook.text}
        </CardContent>
      </Card>
    </section>
  );
}
