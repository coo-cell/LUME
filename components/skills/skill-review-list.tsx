"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SkillContextTag } from "@/lib/types/database";

interface Item {
  name: string;
  evidence: string;
  context_tag: SkillContextTag;
  keep: boolean;
}

interface Props {
  items: Item[];
  onChange: (items: Item[]) => void;
  contextOptions: { value: SkillContextTag; label: string }[];
  disabled: boolean;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export function SkillReviewList({
  items,
  onChange,
  contextOptions,
  disabled,
  onBack,
  onSubmit,
  loading,
  error,
}: Props) {
  function patch(idx: number, partial: Partial<Item>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...partial } : it)));
  }

  const keptCount = items.filter((it) => it.keep).length;

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <p className="text-sm text-muted-foreground">
          Перевір, редагуй назви або зніми галку — підтвердяться тільки те, з
          чим ти згоден.
        </p>

        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={i}
              className={cn(
                "rounded-md border p-4 transition-opacity",
                !item.keep && "opacity-50",
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`skill-name-${i}`}
                    className="text-xs text-muted-foreground"
                  >
                    Назва скілу
                  </Label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={item.keep}
                      onChange={(e) => patch(i, { keep: e.target.checked })}
                      disabled={disabled}
                      className="h-4 w-4 cursor-pointer"
                    />
                    Зберегти
                  </label>
                </div>
                <Input
                  id={`skill-name-${i}`}
                  value={item.name}
                  onChange={(e) => patch(i, { name: e.target.value })}
                  disabled={disabled || !item.keep}
                />

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Контекст
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {contextOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patch(i, { context_tag: opt.value })}
                        disabled={disabled || !item.keep}
                        className={cn(
                          "rounded-md border px-3 py-1 text-xs transition-colors",
                          item.context_tag === opt.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-accent",
                          (disabled || !item.keep) &&
                            "cursor-not-allowed opacity-60",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Підтвердження: {item.evidence}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} disabled={disabled}>
            Назад
          </Button>
          <Button onClick={onSubmit} disabled={disabled || keptCount === 0}>
            {loading
              ? "Зберігаємо..."
              : keptCount === 1
                ? "Зберегти 1 скіл"
                : `Зберегти ${keptCount} скіли`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
