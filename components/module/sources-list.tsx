"use client";

import type { ModuleContent } from "@/lib/types/database";

interface Props {
  sources: ModuleContent["core"]["sources"];
  onOpened: () => void;
}

const TYPE_LABEL: Record<"book" | "article" | "research", string> = {
  book: "Книга",
  article: "Стаття",
  research: "Дослідження",
};

export function SourcesList({ sources, onOpened }: Props) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources-heading" className="space-y-3">
      <h3
        id="sources-heading"
        className="text-sm font-medium uppercase tracking-wider text-muted-foreground"
      >
        Джерела
      </h3>
      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li key={i} className="rounded-md border p-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium">{s.title}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {TYPE_LABEL[s.type] ?? s.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{s.author}</p>
            <p className="mt-2 text-sm">{s.relevance}</p>
            <button
              type="button"
              onClick={onOpened}
              className="mt-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Позначити як переглянуте
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
