"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ModuleContent } from "@/lib/types/database";

interface Props {
  action: ModuleContent["action"];
  taskCompleted: boolean;
  reflection: string;
  onTaskToggle: (v: boolean) => void;
  onReflectionChange: (v: string) => void;
}

export function ActAction({
  action,
  taskCompleted,
  reflection,
  onTaskToggle,
  onReflectionChange,
}: Props) {
  return (
    <section aria-labelledby="action-heading" className="space-y-3">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Акт 3 · Дія
        </p>
        <h2 id="action-heading" className="text-2xl font-semibold tracking-tight">
          Зроби сьогодні
        </h2>
      </header>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Мікро-завдання · 5–10 хв
            </p>
            <p className="mt-2 text-base leading-relaxed">{action.task}</p>
          </div>

          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
              taskCompleted ? "border-primary bg-accent" : "hover:bg-accent",
            )}
          >
            <input
              type="checkbox"
              checked={taskCompleted}
              onChange={(e) => onTaskToggle(e.target.checked)}
              className="h-4 w-4"
            />
            Я виконав мікро-завдання
          </label>

          <div className="space-y-2">
            <Label htmlFor="reflection">{action.reflection_prompt}</Label>
            <Textarea
              id="reflection"
              value={reflection}
              onChange={(e) => onReflectionChange(e.target.value)}
              rows={4}
              placeholder="Що ти помітив, коли зробив це?"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
