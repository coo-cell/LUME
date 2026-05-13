import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance: number | null = null;
  if (user) {
    const { data } = await supabase
      .from("tokens")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    balance = data?.balance ?? null;
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Lume
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              {balance !== null && (
                <span className="text-sm text-muted-foreground">
                  {balance.toLocaleString("uk-UA")} токенів
                </span>
              )}
              <Link
                href="/profile"
                className="text-sm hover:underline underline-offset-4"
              >
                Профіль
              </Link>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  Вийти
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Увійти</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
