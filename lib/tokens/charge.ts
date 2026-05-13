import { createAdminClient } from "@/lib/supabase/admin";
import type { TokenActionType } from "@/lib/types/database";

export const TOKEN_COSTS: Record<TokenActionType, number> = {
  onboarding: 500,
  module_generation: 1500,
  skill_detection: 300,
  retrospective: 800,
  purchase: 0,
  renewal: 0,
};

export class InsufficientTokensError extends Error {
  constructor(public readonly balance: number, public readonly required: number) {
    super(`Insufficient tokens: have ${balance}, need ${required}`);
    this.name = "InsufficientTokensError";
  }
}

export async function getBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tokens")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.balance ?? 0;
}

export async function assertBalance(userId: string, required: number) {
  const balance = await getBalance(userId);
  if (balance < required) throw new InsufficientTokensError(balance, required);
  return balance;
}

interface ChargeOptions {
  userId: string;
  actionType: TokenActionType;
  amount?: number;
  referenceId?: string;
}

// Decrement balance and write a transaction row. NOT a true atomic transaction:
// concurrent charges could race. Acceptable for MVP — tighten later with a
// SECURITY DEFINER function once charge frequency justifies it.
export async function charge({
  userId,
  actionType,
  amount,
  referenceId,
}: ChargeOptions): Promise<{ balanceAfter: number }> {
  const cost = amount ?? TOKEN_COSTS[actionType];
  if (cost <= 0) throw new Error(`No cost configured for ${actionType}`);

  const admin = createAdminClient();
  const balance = await getBalance(userId);
  if (balance < cost) throw new InsufficientTokensError(balance, cost);

  const balanceAfter = balance - cost;

  const { error: updateErr } = await admin
    .from("tokens")
    .update({ balance: balanceAfter })
    .eq("user_id", userId);
  if (updateErr) throw updateErr;

  const { error: txErr } = await admin.from("token_transactions").insert({
    user_id: userId,
    amount: -cost,
    action_type: actionType,
    reference_id: referenceId ?? null,
    balance_after: balanceAfter,
  });
  if (txErr) throw txErr;

  return { balanceAfter };
}
