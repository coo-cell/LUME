"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_TASK } from "./onboarding-content";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

interface Props {
  onComplete: (data: OnboardingInput["task_priority"]) => void;
}

// Order is stored as indexes into PRIORITY_TASK.tasks. We expose simple
// up/down arrows instead of drag-and-drop — reliable on mobile and good enough
// for the signal we need (logic in explanation matters more than micro-UI).
export function TaskPriority({ onComplete }: Props) {
  const startedAt = useRef(Date.now());
  const [order, setOrder] = useState<number[]>(
    PRIORITY_TASK.tasks.map((_, i) => i),
  );
  const [explanation, setExplanation] = useState("");

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    setOrder((cur) => {
      const next = [...cur];
      const [v] = next.splice(from, 1);
      next.splice(to, 0, v);
      return next;
    });
  }

  function submit() {
    onComplete({
      tasks: PRIORITY_TASK.tasks,
      final_order: order,
      explanation: explanation.trim(),
      time_to_order_sec: Math.round((Date.now() - startedAt.current) / 1000),
    });
  }

  const canSubmit = explanation.trim().length >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Задача 3 · Пріоритизація</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{PRIORITY_TASK.intro}</p>

        <ol className="space-y-2">
          {order.map((taskIdx, pos) => (
            <li
              key={taskIdx}
              className="flex items-center gap-3 rounded-md border p-3 text-sm"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {pos + 1}
              </span>
              <span className="flex-1">{PRIORITY_TASK.tasks[taskIdx]}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => move(pos, pos - 1)}
                  disabled={pos === 0}
                  aria-label="Вище"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => move(pos, pos + 1)}
                  disabled={pos === order.length - 1}
                  aria-label="Нижче"
                >
                  ↓
                </Button>
              </div>
            </li>
          ))}
        </ol>

        <div className="space-y-2">
          <Label htmlFor="why">Чому саме так?</Label>
          <Textarea
            id="why"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Що для тебе зробило цей порядок логічним"
          />
        </div>

        <Button onClick={submit} disabled={!canSubmit}>
          Далі
        </Button>
      </CardContent>
    </Card>
  );
}
