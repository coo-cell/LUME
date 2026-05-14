"use client";

import { ActivePause } from "./active-pause";
import { SourcesList } from "./sources-list";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleContent } from "@/lib/types/database";

interface Props {
  core: ModuleContent["core"];
  pauseAnswers: string[];
  onPauseChange: (sectionIdx: number, value: string) => void;
  onSourcesOpened: () => void;
}

export function ActCore({
  core,
  pauseAnswers,
  onPauseChange,
  onSourcesOpened,
}: Props) {
  return (
    <section aria-labelledby="core-heading" className="space-y-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Акт 2 · Ядро
        </p>
        <h2 id="core-heading" className="text-2xl font-semibold tracking-tight">
          Контент
        </h2>
      </header>

      <div className="space-y-5">
        {core.sections.map((section, i) => (
          <div key={i} className="space-y-4">
            <Card>
              <CardContent className="whitespace-pre-line pt-6 text-base leading-relaxed">
                {section.text}
              </CardContent>
            </Card>
            {section.pause && (
              <ActivePause
                question={section.pause.question}
                type={section.pause.type}
                value={pauseAnswers[i] ?? ""}
                onChange={(v) => onPauseChange(i, v)}
              />
            )}
          </div>
        ))}
      </div>

      <SourcesList sources={core.sources} onOpened={onSourcesOpened} />
    </section>
  );
}
