"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SkillContextTag } from "@/lib/types/database";

import { SkillReviewList } from "./skill-review-list";
import { SkillStepProgress } from "./skill-step-progress";

const MIN_LEN = 80;

const CONTEXT_OPTIONS: { value: SkillContextTag; label: string }[] = [
  { value: "work", label: "Робота" },
  { value: "leadership", label: "Лідерство" },
  { value: "creative", label: "Творче" },
  { value: "personal", label: "Особисте" },
];

interface Suggestion {
  name: string;
  evidence: string;
  context_tag: SkillContextTag;
}

interface ConfirmedSkill {
  name: string;
  evidence: string;
  context_tag: SkillContextTag;
  keep: boolean;
}

type Phase = "event" | "questions" | "suggestions" | "saving";

export function NewSkillEvent() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("event");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ConfirmedSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitDescription() {
    setError(null);
    if (description.trim().length < MIN_LEN) {
      setError("Опиши хоча б у трьох реченнях.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/detect-skills/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_description: description.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      const qs: string[] = body.questions ?? [];
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
      setPhase("questions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswers() {
    setError(null);
    const filled = answers.filter((a) => a.trim().length > 0).length;
    if (filled < questions.length) {
      setError("Дай відповідь на всі питання.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/detect-skills/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_description: description.trim(),
          clarifying_answers: questions.map((q, i) => ({
            question: q,
            answer: answers[i].trim(),
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      const sugg: Suggestion[] = body.suggestions ?? [];
      setSuggestions(sugg.map((s) => ({ ...s, keep: true })));
      setPhase("suggestions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  async function submitConfirmed() {
    setError(null);
    const confirmed = suggestions
      .filter((s) => s.keep && s.name.trim() && s.evidence.trim())
      .map((s) => ({
        name: s.name.trim(),
        context_tag: s.context_tag,
        evidence: s.evidence.trim(),
      }));
    if (confirmed.length === 0) {
      setError("Залиш хоча б один скіл або поверніcь і змінь опис.");
      return;
    }
    setLoading(true);
    setPhase("saving");
    try {
      const res = await fetch("/api/skills/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_description: description.trim(),
          clarifying_answers: questions.map((q, i) => ({
            question: q,
            answer: answers[i].trim(),
          })),
          confirmed,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      router.push("/skills");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
      setPhase("suggestions");
    } finally {
      setLoading(false);
    }
  }

  const stepIdx =
    phase === "event"
      ? 0
      : phase === "questions"
        ? 1
        : phase === "suggestions"
          ? 2
          : 3;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Додати подію в архів
        </h1>
        <p className="text-sm text-muted-foreground">
          Опиши момент, де ти пишався результатом. Ми витягнемо скіли тільки з
          твоїх слів — без здогадок.
        </p>
      </header>

      <SkillStepProgress currentIdx={stepIdx} />

      {phase === "event" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="event-desc">Опис події (мін. 3 речення)</Label>
              <Textarea
                id="event-desc"
                rows={8}
                placeholder="Що сталося? Що ти зробив? Що було результатом?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {description.trim().length} / {MIN_LEN} символів мінімум
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between">
              <Button asChild variant="ghost">
                <Link href="/skills">Скасувати</Link>
              </Button>
              <Button onClick={submitDescription} disabled={loading}>
                {loading ? "Думаємо..." : "Далі"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "questions" && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <p className="text-sm text-muted-foreground">
              Пара уточнень — щоб ми не вгадували.
            </p>
            {questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <Label htmlFor={`q-${i}`}>{q}</Label>
                <Textarea
                  id={`q-${i}`}
                  rows={3}
                  value={answers[i] ?? ""}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                  disabled={loading}
                />
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setPhase("event")}
                disabled={loading}
              >
                Назад
              </Button>
              <Button onClick={submitAnswers} disabled={loading}>
                {loading ? "Аналізуємо..." : "Далі"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(phase === "suggestions" || phase === "saving") && (
        <SkillReviewList
          items={suggestions}
          onChange={setSuggestions}
          contextOptions={CONTEXT_OPTIONS}
          disabled={loading}
          onBack={() => setPhase("questions")}
          onSubmit={submitConfirmed}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
