"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { READING_TASK } from "./onboarding-content";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

// Indexes mark the "intended" correct answers. They're not graded — they're
// passed to the analyzer as a signal of attentiveness, not as a pass/fail score.
const Q1_CORRECT = 0;
const Q2_CORRECT = 1;

interface Props {
  onComplete: (data: OnboardingInput["task_reading"]) => void;
}

export function TaskReading({ onComplete }: Props) {
  const startedAt = useRef(Date.now());
  const [phase, setPhase] = useState<"reading" | "questions">("reading");
  const [timeToReadSec, setTimeToReadSec] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [q1Choice, setQ1Choice] = useState<number | null>(null);
  const [q2Choice, setQ2Choice] = useState<number | null>(null);
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
      comprehension_q1: READING_TASK.comprehension_q1.question,
      comprehension_q1_options: READING_TASK.comprehension_q1.options,
      comprehension_q1_choice_index: q1Choice,
      comprehension_q1_correct_index: Q1_CORRECT,
      comprehension_q2: READING_TASK.comprehension_q2.question,
      comprehension_q2_options: READING_TASK.comprehension_q2.options,
      comprehension_q2_choice_index: q2Choice,
      comprehension_q2_correct_index: Q2_CORRECT,
      open_question: READING_TASK.open_question,
      open_answer: open.trim(),
      time_to_read_sec: timeToReadSec,
      time_to_answer_sec: timeToAnswerSec,
      reread: readCount > 1,
    });
  }

  const canSubmit =
    q1Choice !== null && q2Choice !== null && open.trim().length > 0;

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
      <CardContent className="space-y-6">
        <ChoiceQuestion
          label={READING_TASK.comprehension_q1.question}
          options={READING_TASK.comprehension_q1.options}
          value={q1Choice}
          onChange={setQ1Choice}
          name="q1"
        />

        <ChoiceQuestion
          label={READING_TASK.comprehension_q2.question}
          options={READING_TASK.comprehension_q2.options}
          value={q2Choice}
          onChange={setQ2Choice}
          name="q2"
        />

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

interface ChoiceProps {
  label: string;
  options: string[];
  value: number | null;
  onChange: (i: number) => void;
  name: string;
}

function ChoiceQuestion({ label, options, value, onChange, name }: ChoiceProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-accent",
              value === i ? "border-primary bg-accent" : "border-input",
            )}
          >
            <input
              type="radio"
              name={name}
              value={i}
              checked={value === i}
              onChange={() => onChange(i)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
