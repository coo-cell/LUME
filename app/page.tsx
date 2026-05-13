import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="container flex flex-col items-center justify-center gap-8 py-24 text-center">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Персональний план навчання — за твоїм темпом
        </h1>
        <p className="text-lg text-muted-foreground">
          Lume будує програму під твою ціль, темп і стиль. Результат уже цього
          тижня.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button asChild size="lg">
          <Link href="/login">Почати безкоштовно</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          3 000 токенів при реєстрації
        </p>
      </div>
    </div>
  );
}
