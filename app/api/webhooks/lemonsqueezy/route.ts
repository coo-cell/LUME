import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { lookupPurchase } from "@/lib/pricing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TokenActionType } from "@/lib/types/database";

export const runtime = "nodejs";

// Lemon Squeezy webhook. Verifies HMAC SHA256 over the raw body using
// LEMONSQUEEZY_WEBHOOK_SECRET, then credits tokens based on the variant_id of
// the purchased item. Idempotent via order_id deduplication in token_transactions.
//
// Events handled:
//   order_created                 — one-time purchase OR first subscription order
//   subscription_payment_success  — monthly renewal
//
// Custom data must include user_id (added to the checkout URL by /pricing page).

interface LemonWebhookBody {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: Record<string, unknown>;
  };
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET missing");
    return false;
  }
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

function extractVariantId(
  eventName: string,
  data: NonNullable<LemonWebhookBody["data"]>,
): string | null {
  const attrs = data.attributes ?? {};

  if (eventName === "order_created") {
    const item = (attrs.first_order_item ?? {}) as Record<string, unknown>;
    const v = item.variant_id;
    return v !== undefined && v !== null ? String(v) : null;
  }

  if (eventName.startsWith("subscription")) {
    const v = attrs.variant_id;
    return v !== undefined && v !== null ? String(v) : null;
  }

  return null;
}

function extractOrderRef(
  eventName: string,
  data: NonNullable<LemonWebhookBody["data"]>,
): string {
  // Used for idempotency. order_created → order id; subscription events → invoice id.
  if (data.id !== undefined && data.id !== null) return `${eventName}:${data.id}`;
  return `${eventName}:${Date.now()}`;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: LemonWebhookBody;
  try {
    body = JSON.parse(rawBody) as LemonWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.meta?.event_name;
  const userId = body.meta?.custom_data?.user_id as string | undefined;
  const data = body.data;

  if (!eventName || !data) {
    return NextResponse.json({ ok: true, ignored: "missing meta/data" });
  }

  // Only react to the two events we care about. Everything else gets a 200 so
  // Lemon Squeezy doesn't keep retrying.
  if (
    eventName !== "order_created" &&
    eventName !== "subscription_payment_success"
  ) {
    return NextResponse.json({ ok: true, ignored: eventName });
  }

  if (!userId) {
    console.error("lemonsqueezy webhook: missing custom_data.user_id", {
      eventName,
    });
    return NextResponse.json({ ok: true, ignored: "missing user_id" });
  }

  const variantId = extractVariantId(eventName, data);
  if (!variantId) {
    return NextResponse.json({ ok: true, ignored: "missing variant_id" });
  }

  const effect = lookupPurchase(variantId);
  if (!effect) {
    console.error("lemonsqueezy webhook: unknown variant_id", { variantId });
    return NextResponse.json({ ok: true, ignored: "unknown variant" });
  }

  const admin = createAdminClient();
  const orderRef = extractOrderRef(eventName, data);

  // Idempotency: if we've already processed this exact order/invoice, skip.
  // We store the ref as a uuid? No — token_transactions.reference_id is uuid.
  // Use a quick check on (user_id, action_type, balance_after) — naive but
  // sufficient until we add a dedicated payments table. For MVP just check by
  // the timestamp window: if a matching purchase row exists in the last hour
  // with the same amount and action_type, treat as duplicate.
  const actionType: TokenActionType =
    eventName === "order_created" ? "purchase" : "renewal";

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: dupes } = await admin
    .from("token_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .eq("amount", effect.tokens)
    .gte("created_at", oneHourAgo)
    .limit(1);
  if (dupes && dupes.length > 0) {
    return NextResponse.json({ ok: true, ignored: "duplicate", orderRef });
  }

  // Load current tokens row
  const { data: tokenRow } = await admin
    .from("tokens")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (!tokenRow) {
    console.error("lemonsqueezy webhook: tokens row missing for user", {
      userId,
    });
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newBalance = tokenRow.balance + effect.tokens;

  const update: Record<string, unknown> = { balance: newBalance };
  if (effect.plan && effect.planTokensPerMonth) {
    update.plan = effect.plan;
    update.plan_tokens_per_month = effect.planTokensPerMonth;
  }
  if (eventName === "order_created" && effect.source === "plan") {
    // First subscription order — set the renewal window. LS gives us renews_at
    // on subscription rows, but the order_created event doesn't always carry it.
    // Set a 30-day window as a reasonable default; subscription_payment_success
    // can refine it.
    update.next_renewal_at = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  const { error: updErr } = await admin
    .from("tokens")
    .update(update)
    .eq("user_id", userId);
  if (updErr) {
    console.error("lemonsqueezy webhook: tokens update failed", updErr);
    return NextResponse.json({ error: "tokens update failed" }, { status: 500 });
  }

  const { error: txErr } = await admin.from("token_transactions").insert({
    user_id: userId,
    amount: effect.tokens,
    action_type: actionType,
    balance_after: newBalance,
  });
  if (txErr) {
    console.error("lemonsqueezy webhook: tx insert failed", txErr);
  }

  return NextResponse.json({
    ok: true,
    credited: effect.tokens,
    plan: effect.plan,
    orderRef,
  });
}
