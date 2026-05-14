import Link from "next/link";

import { HeaderNav, type NavLink } from "@/components/header-nav";
import { createClient } from "@/lib/supabase/server";

const AUTHED_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/modules", label: "Модулі" },
  { href: "/skills", label: "Скіли" },
  { href: "/profile", label: "Профіль" },
];

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance: number | null = null;
  let monthlyAllocation = 3000;
  if (user) {
    const { data } = await supabase
      .from("tokens")
      .select("balance, plan, plan_tokens_per_month")
      .eq("user_id", user.id)
      .maybeSingle();
    balance = data?.balance ?? null;
    monthlyAllocation = data?.plan_tokens_per_month ?? 3000;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : "/"} className="text-lg font-semibold tracking-tight">
          Lume
        </Link>

        {user ? (
          <HeaderNav links={AUTHED_LINKS} balance={balance} monthlyAllocation={monthlyAllocation} />
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Увійти
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Створити акаунт
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
