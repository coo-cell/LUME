import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = ["Опис", "Уточнення", "Скіли", "Готово"];

interface Props {
  currentIdx: number;
}

export function SkillStepProgress({ currentIdx }: Props) {
  const value = Math.min(100, ((currentIdx + 1) / STEPS.length) * 100);
  return (
    <div className="space-y-2">
      <Progress value={value} />
      <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={cn(
              "transition-colors",
              i === currentIdx && "font-medium text-foreground",
              i < currentIdx && "text-foreground/70",
            )}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
