"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GOAL_DIALOG_QUESTIONS } from "./onboarding-content";
import type { OnboardingInput } from "@/lib/ai/prompts/analyze-onboarding";

interface Props {
  onComplete: (data: OnboardingInput["goal_dialog"]) => void;
}

type Message =
  | { role: "assistant"; text: string }
  | { role: "user"; text: string };

export function GoalDialog({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: GOAL_DIALOG_QUESTIONS[0].question },
  ]);
  const [answers, setAnswers] = useState<Partial<OnboardingInput["goal_dialog"]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const current = GOAL_DIALOG_QUESTIONS[step];

  function submitAnswer() {
    if (!current) return;
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;

    let parsed: Partial<OnboardingInput["goal_dialog"]> = {};
    if (current.id === "weekly_time_minutes") {
      const n = parseWeeklyMinutes(trimmed);
      if (n === null) {
        setError("Напиши число хвилин — наприклад, 90 або 120.");
        return;
      }
      parsed = { weekly_time_minutes: n };
    } else if (current.id === "content_format") {
      const fmt = parseContentFormat(trimmed);
      if (fmt === null) {
        setError('Напиши "читати", "слухати" або "все одно".');
        return;
      }
      parsed = { content_format: fmt };
    } else {
      parsed = { [current.id]: trimmed } as Partial<OnboardingInput["goal_dialog"]>;
    }

    setError(null);
    const newMessages: Message[] = [
      ...messages,
      { role: "user", text: trimmed },
    ];

    const nextAnswers = { ...answers, ...parsed };
    setAnswers(nextAnswers);
    setDraft("");

    const nextStep = step + 1;
    if (nextStep < GOAL_DIALOG_QUESTIONS.length) {
      newMessages.push({
        role: "assistant",
        text: GOAL_DIALOG_QUESTIONS[nextStep].question,
      });
      setMessages(newMessages);
      setStep(nextStep);
    } else {
      setMessages(newMessages);
      onComplete(nextAnswers as OnboardingInput["goal_dialog"]);
    }
  }

  const done = step >= GOAL_DIALOG_QUESTIONS.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Кілька запитань про твою ціль</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={scrollRef}
          className="max-h-[300px] space-y-3 overflow-y-auto rounded-md border bg-muted/20 p-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "assistant"
                  ? "text-sm"
                  : "ml-8 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              }
            >
              {m.text}
            </div>
          ))}
        </div>

        {!done && (
          <>
            {current.hint && (
              <p className="text-xs text-muted-foreground">{current.hint}</p>
            )}
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={current.id === "weekly_time_minutes" || current.id === "content_format" ? 1 : 3}
              placeholder="Твоя відповідь..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={submitAnswer} disabled={draft.trim().length === 0}>
              Відправити
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function parseWeeklyMinutes(input: string): number | null {
  // Accept "90", "90 хв", "1 год 30", "1.5 год", "2h"
  const lower = input.toLowerCase();
  const hourMatch = lower.match(/([\d.,]+)\s*(год|h|hour|hours|hr)/);
  const minMatch = lower.match(/([\d.,]+)\s*(хв|мин|min|minutes|m\b)/);
  let total = 0;
  let matched = false;
  if (hourMatch) {
    total += parseFloat(hourMatch[1].replace(",", ".")) * 60;
    matched = true;
  }
  if (minMatch) {
    total += parseFloat(minMatch[1].replace(",", "."));
    matched = true;
  }
  if (!matched) {
    const n = parseFloat(lower.replace(",", "."));
    if (Number.isFinite(n)) total = n;
    else return null;
  }
  if (!Number.isFinite(total) || total <= 0 || total > 60 * 40) return null;
  return Math.round(total);
}

function parseContentFormat(input: string): "text" | "audio" | "both" | null {
  const l = input.toLowerCase();
  if (/(чита|read|text|текст)/.test(l)) return "text";
  if (/(слух|audio|listen|подкаст)/.test(l)) return "audio";
  if (/(все одно|обид|both|байдуж|без різниц)/.test(l)) return "both";
  return null;
}
