"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  goalDescription: string | null;
}

const PROGRESS_MESSAGES = [
  "Шукаємо персональний місток до твоєї цілі...",
  "Складаємо ядро модуля...",
  "Збираємо джерела...",
  "Готуємо мікро-завдання на сьогодні...",
];

export function GeneratingTrigger({ goalDescription }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [messageIdx, setMessageIdx] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    // StrictMode in dev runs effects setup→cleanup→setup. The ref survives,
    // so we guard against starting twice. We DO NOT abort on cleanup — that
    // would cancel the only in-flight request after StrictMode's cleanup,
    // leaving the UI hanging. Server-side dedup catches the rare cases where
    // a real second request still slips through (back/forward, refresh).
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function generate() {
      try {
        const res = await fetch("/api/ai/generate-module", { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const { module_id } = (await res.json()) as { module_id: string };
        if (cancelled) return;
        router.push(`/module/${module_id}`);
        router.refresh();
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Невідома помилка");
      }
    }

    void generate();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (error) return;
    const id = window.setInterval(() => {
      setMessageIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [error]);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="space-y-4 py-10 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Щось пішло не так
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() => {
                startedRef.current = false;
                setError(null);
                router.refresh();
              }}
            >
              Спробувати ще раз
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">У Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Готуємо твій перший модуль
          </h1>
          {goalDescription && (
            <p className="text-sm text-muted-foreground">
              Під ціль: {goalDescription}
            </p>
          )}
          <p
            key={messageIdx}
            className="text-sm text-muted-foreground transition-opacity duration-500"
          >
            {PROGRESS_MESSAGES[messageIdx]}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Це займає 20–40 сек. Не закривай вкладку.
        </p>
      </CardContent>
    </Card>
  );
}
