"use client";

import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PRIORITY_TASK } from "./onboarding-content";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

interface Props {
  onComplete: (data: OnboardingInput["task_priority"]) => void;
}

// HTML5 native DnD on desktop, with ↑↓ buttons retained for touch and a11y.
// Items store original-index values so reorders preserve the source mapping.
export function TaskPriority({ onComplete }: Props) {
  const startedAt = useRef(Date.now());
  const [order, setOrder] = useState<number[]>(
    PRIORITY_TASK.tasks.map((_, i) => i),
  );
  const [explanation, setExplanation] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= order.length) return;
    setOrder((cur) => {
      const next = [...cur];
      const [v] = next.splice(from, 1);
      next.splice(to, 0, v);
      return next;
    });
  }

  function onDragStart(e: DragEvent<HTMLLIElement>, pos: number) {
    setDragFrom(pos);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require setData to start the drag.
    e.dataTransfer.setData("text/plain", String(pos));
  }

  function onDragOver(e: DragEvent<HTMLLIElement>, pos: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== pos) setDragOver(pos);
  }

  function onDrop(e: DragEvent<HTMLLIElement>, pos: number) {
    e.preventDefault();
    const from = dragFrom ?? Number(e.dataTransfer.getData("text/plain"));
    setDragFrom(null);
    setDragOver(null);
    if (Number.isFinite(from)) reorder(from, pos);
  }

  function onDragEnd() {
    setDragFrom(null);
    setDragOver(null);
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
        <p className="text-xs text-muted-foreground">
          Перетягни мишею або використовуй кнопки ↑ ↓
        </p>

        <ol className="space-y-2">
          {order.map((taskIdx, pos) => (
            <li
              key={taskIdx}
              draggable
              onDragStart={(e) => onDragStart(e, pos)}
              onDragOver={(e) => onDragOver(e, pos)}
              onDrop={(e) => onDrop(e, pos)}
              onDragEnd={onDragEnd}
              onDragLeave={() => setDragOver(null)}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                dragFrom === pos && "opacity-50",
                dragOver === pos && dragFrom !== pos && "border-primary bg-accent",
              )}
            >
              <span
                aria-hidden
                className="cursor-grab select-none text-muted-foreground"
                title="Перетягни"
              >
                ⋮⋮
              </span>
              <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                {pos + 1}
              </span>
              <span className="flex-1">{PRIORITY_TASK.tasks[taskIdx]}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => reorder(pos, pos - 1)}
                  disabled={pos === 0}
                  aria-label="Вище"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => reorder(pos, pos + 1)}
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
