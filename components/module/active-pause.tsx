"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  question: string;
  type: "reflection" | "application" | "recall";
  value: string;
  onChange: (v: string) => void;
}

const TYPE_LABEL: Record<Props["type"], string> = {
  reflection: "Рефлексія",
  application: "Застосування",
  recall: "Згадай",
};

export function ActivePause({ question, type, value, onChange }: Props) {
  return (
    <div
      className={cn(
        "rounded-md border-l-4 border-primary/60 bg-muted/40 p-4",
      )}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Пауза · {TYPE_LABEL[type]}
      </p>
      <Label className="text-sm font-medium leading-snug">{question}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Твоя відповідь — для себе"
        className="mt-3"
      />
    </div>
  );
}
