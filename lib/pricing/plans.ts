import type { TokenPlan } from "@/lib/types/database";

// Pricing config. Checkout URLs and Lemon Squeezy variant IDs come from env vars
// so we never hardcode store-specific identifiers. The webhook uses variantId →
// {tokens, plan?} to know what to credit when a payment lands.

export interface PlanDef {
  id: TokenPlan;
  name: string;
  monthlyTokens: number;
  priceUsd: number;
  description: string;
  features: string[];
  variantId: string | null;
  checkoutUrl: string | null;
}

export interface TokenPackDef {
  id: string;
  name: string;
  tokens: number;
  priceUsd: number;
  variantId: string | null;
  checkoutUrl: string | null;
}

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    monthlyTokens: 3000,
    priceUsd: 0,
    description: "Стартовий пакет — один-два модулі і онбординг.",
    features: [
      "3000 токенів при реєстрації",
      "Онбординг + перший модуль",
      "Карта особистості А+Б",
    ],
    variantId: null,
    checkoutUrl: null,
  },
  {
    id: "core",
    name: "Core",
    monthlyTokens: 12000,
    priceUsd: 9,
    description: "Регулярне навчання — модуль кожні кілька днів.",
    features: [
      "12 000 токенів щомісяця",
      "До ~6 модулів на місяць",
      "Карта скілів з рівнями",
      "30-денна ретроспектива",
    ],
    variantId: process.env.LEMONSQUEEZY_VARIANT_CORE ?? null,
    checkoutUrl: process.env.LEMONSQUEEZY_CHECKOUT_CORE_URL ?? null,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyTokens: 40000,
    priceUsd: 29,
    description: "Глибока робота — щоденні модулі і вся аналітика.",
    features: [
      "40 000 токенів щомісяця",
      "Без обмежень на модулі",
      "Пріоритетна підтримка моделі",
      "Раннній доступ до нових фічей",
    ],
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO ?? null,
    checkoutUrl: process.env.LEMONSQUEEZY_CHECKOUT_PRO_URL ?? null,
  },
];

export const TOKEN_PACKS: TokenPackDef[] = [
  {
    id: "pack_5k",
    name: "5 000 токенів",
    tokens: 5000,
    priceUsd: 5,
    variantId: process.env.LEMONSQUEEZY_VARIANT_PACK_5K ?? null,
    checkoutUrl: process.env.LEMONSQUEEZY_CHECKOUT_PACK_5K_URL ?? null,
  },
  {
    id: "pack_15k",
    name: "15 000 токенів",
    tokens: 15000,
    priceUsd: 12,
    variantId: process.env.LEMONSQUEEZY_VARIANT_PACK_15K ?? null,
    checkoutUrl: process.env.LEMONSQUEEZY_CHECKOUT_PACK_15K_URL ?? null,
  },
  {
    id: "pack_50k",
    name: "50 000 токенів",
    tokens: 50000,
    priceUsd: 35,
    variantId: process.env.LEMONSQUEEZY_VARIANT_PACK_50K ?? null,
    checkoutUrl: process.env.LEMONSQUEEZY_CHECKOUT_PACK_50K_URL ?? null,
  },
];

// Webhook lookup: given a Lemon Squeezy variant_id from an order, return the
// tokens to credit and (if it's a plan) the plan id to set. Returns null for
// unknown variants — webhook will log and return 200 so LS doesn't retry.
export interface PurchaseEffect {
  tokens: number;
  plan: TokenPlan | null;
  planTokensPerMonth: number | null;
  source: "plan" | "pack";
  label: string;
}

export function lookupPurchase(variantId: string | number): PurchaseEffect | null {
  const id = String(variantId);

  for (const plan of PLANS) {
    if (plan.variantId && plan.variantId === id) {
      return {
        tokens: plan.monthlyTokens,
        plan: plan.id,
        planTokensPerMonth: plan.monthlyTokens,
        source: "plan",
        label: plan.name,
      };
    }
  }

  for (const pack of TOKEN_PACKS) {
    if (pack.variantId && pack.variantId === id) {
      return {
        tokens: pack.tokens,
        plan: null,
        planTokensPerMonth: null,
        source: "pack",
        label: pack.name,
      };
    }
  }

  return null;
}
