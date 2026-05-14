import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, TOKEN_PACKS } from "@/lib/pricing/plans";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Тарифи — Lume" };

// Append user_id + email to a Lemon Squeezy checkout URL so the webhook can map
// the order back to our user. LS passes these through as `meta.custom_data` and
// in the order payload. If the URL is missing (env not configured) we return
// null and the UI shows a "скоро" placeholder.
function withCustomData(
  url: string | null,
  userId: string | null,
  email: string | null,
): string | null {
  if (!url) return null;
  if (!userId) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("checkout[custom][user_id]", userId);
    if (email) u.searchParams.set("checkout[email]", email);
    return u.toString();
  } catch {
    return url;
  }
}

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: string = "free";
  let balance: number | null = null;
  if (user) {
    const { data } = await supabase
      .from("tokens")
      .select("plan, balance")
      .eq("user_id", user.id)
      .maybeSingle();
    currentPlan = data?.plan ?? "free";
    balance = data?.balance ?? null;
  }

  const userId = user?.id ?? null;
  const email = user?.email ?? null;

  return (
    <div className="container max-w-5xl space-y-10 py-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Тарифи</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Lume оплачується токенами. Один модуль = 1500 токенів, скіл з події =
          300, ретроспектива = 800. Обирай план під свій темп.
        </p>
        {balance !== null && (
          <p className="text-xs text-muted-foreground">
            Поточний баланс: {balance.toLocaleString("uk-UA")} токенів · план «
            {currentPlan}»
          </p>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const checkout = withCustomData(plan.checkoutUrl, userId, email);
          return (
            <Card
              key={plan.id}
              className={cn(isCurrent && "border-primary")}
            >
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <span className="text-sm font-medium">
                    {plan.priceUsd === 0
                      ? "$0"
                      : `$${plan.priceUsd}`}
                    {plan.priceUsd > 0 && (
                      <span className="text-xs text-muted-foreground">
                        /міс
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium">
                  {plan.monthlyTokens.toLocaleString("uk-UA")} токенів
                  {plan.priceUsd > 0 && " щомісяця"}
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden>·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <Button
                    asChild={!user}
                    disabled={!!user && isCurrent}
                    variant={isCurrent ? "outline" : "default"}
                    className="w-full"
                  >
                    {user ? (
                      <span>{isCurrent ? "Поточний план" : "Free план"}</span>
                    ) : (
                      <Link href="/register">Почати безкоштовно</Link>
                    )}
                  </Button>
                ) : checkout ? (
                  <Button
                    asChild
                    variant={isCurrent ? "outline" : "default"}
                    className="w-full"
                  >
                    {isCurrent ? (
                      <Link href={checkout}>Керувати підпискою</Link>
                    ) : user ? (
                      <a href={checkout} rel="noopener noreferrer">
                        Підключити
                      </a>
                    ) : (
                      <Link href={`/register?next=/pricing`}>
                        Створити акаунт
                      </Link>
                    )}
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full">
                    Скоро
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Докупити токени
          </h2>
          <p className="text-sm text-muted-foreground">
            Якщо план закінчився раніше місяця — без зміни підписки.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          {TOKEN_PACKS.map((pack) => {
            const checkout = withCustomData(pack.checkoutUrl, userId, email);
            return (
              <Card key={pack.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-baseline justify-between">
                    <p className="text-base font-medium">{pack.name}</p>
                    <p className="text-sm font-medium">${pack.priceUsd}</p>
                  </div>
                  {checkout ? (
                    <Button asChild className="w-full" variant="outline">
                      {user ? (
                        <a href={checkout} rel="noopener noreferrer">
                          Купити
                        </a>
                      ) : (
                        <Link href={`/register?next=/pricing`}>Увійти</Link>
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      Скоро
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="text-center text-xs text-muted-foreground">
        Оплата через Lemon Squeezy. Можна скасувати будь-коли — токени до кінця
        періоду залишаться.
      </footer>
    </div>
  );
}
