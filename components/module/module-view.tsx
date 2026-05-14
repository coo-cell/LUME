"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ActAction } from "./act-action";
import { ActCore } from "./act-core";
import { ActHook } from "./act-hook";
import { Button } from "@/components/ui/button";
import type { ModuleContent, PauseResponse } from "@/lib/types/database";

interface Props {
  moduleId: string;
  title: string;
  content: ModuleContent;
  status: "generated" | "in_progress" | "completed";
}

export function ModuleView({ moduleId, title, content, status: initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pauseAnswers, setPauseAnswers] = useState<string[]>(() =>
    content.core.sections.map(() => ""),
  );
  const [sourcesOpened, setSourcesOpened] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // First view of a "generated" module → mark in_progress. Fire-and-forget;
  // failure here doesn't block the user from reading.
  useEffect(() => {
    if (initialStatus !== "generated" || startedRef.current) return;
    startedRef.current = true;
    void fetch("/api/module/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id: moduleId }),
    }).then(() => setStatus("in_progress"));
  }, [initialStatus, moduleId]);

  async function complete() {
    setSubmitting(true);
    setError(null);

    const responses: PauseResponse[] = content.core.sections.flatMap(
      (section, i) => {
        if (!section.pause) return [];
        const answer = pauseAnswers[i] ?? "";
        return [
          {
            question: section.pause.question,
            answer,
            length: answer.length,
          },
        ];
      },
    );

    try {
      const res = await fetch("/api/module/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: moduleId,
          pause_responses: responses,
          task_completed: taskCompleted,
          reflection,
          sources_opened: sourcesOpened,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невідома помилка");
      setSubmitting(false);
    }
  }

  return (
    <article className="container max-w-3xl space-y-10 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {status === "completed"
            ? "Модуль завершено"
            : "Близько 25–45 хв · можна повертатись"}
        </p>
      </header>

      <ActHook hook={content.hook} />

      <ActCore
        core={content.core}
        pauseAnswers={pauseAnswers}
        onPauseChange={(i, v) =>
          setPauseAnswers((cur) => {
            const next = [...cur];
            next[i] = v;
            return next;
          })
        }
        onSourcesOpened={() => setSourcesOpened(true)}
      />

      <ActAction
        action={content.action}
        taskCompleted={taskCompleted}
        reflection={reflection}
        onTaskToggle={setTaskCompleted}
        onReflectionChange={setReflection}
      />

      {status !== "completed" && (
        <div className="space-y-3 border-t pt-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {taskCompleted
                ? "Готовий завершити модуль і піти робити дію?"
                : "Можна завершити навіть якщо ще не виконав мікро-завдання — повернись до нього сьогодні."}
            </p>
            <Button onClick={complete} disabled={submitting}>
              {submitting ? "Зберігаємо..." : "Завершити модуль"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
