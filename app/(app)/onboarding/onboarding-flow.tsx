"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Generating } from "@/components/onboarding/generating";
import { GoalDialog } from "@/components/onboarding/goal-dialog";
import { TaskDecision } from "@/components/onboarding/task-decision";
import { TaskPriority } from "@/components/onboarding/task-priority";
import { TaskReading } from "@/components/onboarding/task-reading";
import { Progress } from "@/components/ui/progress";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

type Step = "reading" | "decision" | "priority" | "dialog" | "analyzing" | "error";

const STEPS: Exclude<Step, "analyzing" | "error">[] = [
  "reading",
  "decision",
  "priority",
  "dialog",
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("reading");
  const [data, setData] = useState<Partial<OnboardingInput>>({});
  const [error, setError] = useState<string | null>(null);

  const stepIdx = STEPS.indexOf(step as (typeof STEPS)[number]);
  const progress =
    step === "analyzing"
      ? 100
      : ((stepIdx >= 0 ? stepIdx : 0) / STEPS.length) * 100;

  async function submit(full: OnboardingInput) {
    setStep("analyzing");
    try {
      const res = await fetch("/api/ai/analyze-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(full),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невідома помилка");
      setStep("error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {step === "analyzing"
              ? "Аналізуємо"
              : step === "error"
                ? "Помилка"
                : `Крок ${stepIdx + 1} з ${STEPS.length}`}
          </span>
          <span>~10 хв</span>
        </div>
        <Progress value={progress} />
      </div>

      {step === "reading" && (
        <TaskReading
          onComplete={(task_reading) => {
            setData((d) => ({ ...d, task_reading }));
            setStep("decision");
          }}
        />
      )}

      {step === "decision" && (
        <TaskDecision
          onComplete={(task_decision) => {
            setData((d) => ({ ...d, task_decision }));
            setStep("priority");
          }}
        />
      )}

      {step === "priority" && (
        <TaskPriority
          onComplete={(task_priority) => {
            setData((d) => ({ ...d, task_priority }));
            setStep("dialog");
          }}
        />
      )}

      {step === "dialog" && (
        <GoalDialog
          onComplete={(goal_dialog) => {
            const full = { ...data, goal_dialog } as OnboardingInput;
            setData(full);
            void submit(full);
          }}
        />
      )}

      {step === "analyzing" && (
        <Generating message="Аналізуємо твої відповіді. Це займе хвилину." />
      )}

      {step === "error" && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Щось пішло не так</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
          <button
            className="mt-3 text-sm underline underline-offset-4"
            onClick={() => {
              if (data.task_reading && data.task_decision && data.task_priority && data.goal_dialog) {
                void submit(data as OnboardingInput);
              } else {
                setStep("dialog");
              }
              setError(null);
            }}
          >
            Спробувати ще раз
          </button>
        </div>
      )}
    </div>
  );
}
