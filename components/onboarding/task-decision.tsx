"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DECISION_TASK } from "./onboarding-content";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

interface Props {
  onComplete: (data: OnboardingInput["task_decision"]) => void;
}

export function TaskDecision({ onComplete }: Props) {
  const startedAt = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  function submit() {
    onComplete({
      scenario: DECISION_TASK.scenario,
      options: DECISION_TASK.options,
      selected_option_index: useCustom ? null : selected,
      custom_answer: useCustom && custom.trim().length > 0 ? custom.trim() : null,
      time_to_decide_sec: Math.round((Date.now() - startedAt.current) / 1000),
    });
  }

  const canSubmit = useCustom ? custom.trim().length >= 10 : selected !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Задача 2 · Рішення в невизначеності</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed">{DECISION_TASK.scenario}</p>

        <div className="space-y-2">
          {DECISION_TASK.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelected(i);
                setUseCustom(false);
              }}
              className={cn(
                "w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent",
                selected === i && !useCustom
                  ? "border-primary bg-accent"
                  : "border-input",
              )}
            >
              <span className="mr-2 font-medium">{i + 1}.</span>
              {opt}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setUseCustom(true);
              setSelected(null);
            }}
            className={cn(
              "w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent",
              useCustom ? "border-primary bg-accent" : "border-input border-dashed",
            )}
          >
            <span className="mr-2 font-medium">Інше:</span>
            напиши свій варіант
          </button>
        </div>

        {useCustom && (
          <div className="space-y-2">
            <Label htmlFor="custom">Опиши що б ти зробив</Label>
            <Textarea
              id="custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              rows={3}
              placeholder="Своїми словами"
            />
          </div>
        )}

        <Button onClick={submit} disabled={!canSubmit}>
          Далі
        </Button>
      </CardContent>
    </Card>
  );
}
