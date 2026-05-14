import { NextResponse } from "next/server";

import {
  TOKEN_COSTS,
  assertBalance,
  InsufficientTokensError,
} from "@/lib/tokens/charge";
import type { TokenActionType } from "@/lib/types/database";

// Returns null if the user has enough tokens; otherwise returns a NextResponse
// the caller should return as-is. We standardize the 402 shape so the client
// can react to it (toast + link to /pricing) without parsing prose.
export async function guardAITokens(
  userId: string,
  actionType: TokenActionType,
  amount?: number,
): Promise<NextResponse | null> {
  const required = amount ?? TOKEN_COSTS[actionType];
  try {
    await assertBalance(userId, required);
    return null;
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return NextResponse.json(
        {
          error: "Insufficient tokens",
          balance: err.balance,
          required: err.required,
          redirect_to: "/pricing",
        },
        { status: 402 },
      );
    }
    throw err;
  }
}
