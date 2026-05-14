"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface Props {
  balance: number;
  monthlyAllocation: number;
}

// Threshold colors are based on remaining tokens vs the user's monthly allocation
// (3000 for free, plan_tokens_per_month for paid plans). <5% → red, <20% → amber.
export function TokenBalance({ balance, monthlyAllocation }: Props) {
  const ratio = monthlyAllocation > 0 ? balance / monthlyAllocation : 1;
  const critical = ratio < 0.05;
  const low = !critical && ratio < 0.2;

  const label = (
    <span className="tabular-nums">
      {balance.toLocaleString("uk-UA")} токенів
    </span>
  );

  if (critical) {
    return (
      <Link
        href="/pricing"
        title="Купити токени"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline",
        )}
      >
        {label}
        <span aria-hidden>↗</span>
      </Link>
    );
  }

  if (low) {
    return (
      <Link
        href="/pricing"
        title="Скоро закінчаться — купити більше"
        className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href="/pricing"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {label}
    </Link>
  );
}
