"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { READING_TASK } from "./onboarding-content";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

interface Props {
  onComplete: (data: OnboardingInput["task_reading"]) => void;
}

export function TaskReading({ onComplete }: Props) {
  const startedAt = useRef(Date.now());
  const [phase, setPhase] = useState<"reading" | "questions">("reading");
  const [timeToReadSec, setTimeToReadSec] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [open, setOpen] = useState("");
  const questionsStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (phase === "questions" && questionsStartedAt.current === null) {
      questionsStartedAt.current = Date.now();
    }
  }, [phase]);

  function finishReading() {
    setTimeToReadSec(Math.round((Date.now() - startedAt.current) / 1000));
    setReadCount((n) => n + 1);
    setPhase("questions");
  }

  function rereadFromQuestions() {
    setPhase("reading");
    startedAt.current = Date.now();
  }

  function submit() {
    const timeToAnswerSec = questionsStartedAt.current
      ? Math.round((Date.now() - questionsStartedAt.current) / 1000)
      : 0;
    onComplete({
      passage_topic: READING_TASK.passage_topic,
      comprehension_q1_answer: q1.trim(),
      comprehension_q2_answer: q2.trim(),
      open_question: READING_TASK.open_question,
      open_answer: open.trim(),
      time_to_read_sec: timeToReadSec,
      time_to_answer_sec: timeToAnswerSec,
      reread: readCount > 1,
    });
  }

  const canSubmit = q1.trim().length > 0 && q2.trim().length > 0 && open.trim().length > 0;

  if (phase === "reading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Задача 1 · Розуміння тексту</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Прочитай текст у своєму темпі. Коли готовий — натисни далі.
          </p>
          <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
            {READING_TASK.passage.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <Button onClick={finishReading}>Я прочитав</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Задача 1 · Питання</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="q1">{READING_TASK.comprehension_q1}</Label>
          <Textarea
            id="q1"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            rows={2}
            placeholder="Коротко своїми словами"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="q2">{READING_TASK.comprehension_q2}</Label>
          <Textarea
            id="q2"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="open">{READING_TASK.open_question}</Label>
          <Textarea
            id="open"
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            rows={3}
            placeholder="Без шаблонів — як для себе"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={!canSubmit}>
            Далі
          </Button>
          <Button variant="ghost" onClick={rereadFromQuestions}>
            Повернутись до тексту
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
