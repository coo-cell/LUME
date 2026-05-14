"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TokenBalance } from "@/components/token-balance";
import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
}

interface Props {
  links: NavLink[];
  balance: number | null;
  monthlyAllocation: number;
}

export function HeaderNav({ links, balance, monthlyAllocation }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="hidden items-center gap-6 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "text-sm transition-colors",
              pathname.startsWith(l.href)
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <BalanceSlot value={balance} monthlyAllocation={monthlyAllocation} />
        <SignOutButton />
      </div>

      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border md:hidden"
        aria-label={open ? "Закрити меню" : "Відкрити меню"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden className="text-lg leading-none">
          {open ? "×" : "≡"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 border-b bg-background shadow-md md:hidden">
          <div className="container space-y-2 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname.startsWith(l.href)
                    ? "bg-accent font-medium"
                    : "hover:bg-accent",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between border-t pt-3">
              <BalanceSlot value={balance} monthlyAllocation={monthlyAllocation} />
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BalanceSlot({
  value,
  monthlyAllocation,
}: {
  value: number | null;
  monthlyAllocation: number;
}) {
  if (value === null) return null;
  return <TokenBalance balance={value} monthlyAllocation={monthlyAllocation} />;
}

function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Вийти
      </button>
    </form>
  );
}
