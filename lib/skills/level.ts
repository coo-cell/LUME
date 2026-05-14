import type { SkillLevel } from "@/lib/types/database";

// Level is derived from the count of DISTINCT context_tag confirmations.
// 1 = discovered, 2-3 = growing, 5-6 = experienced, 8+ = master.
// 4 and 7 round down (still growing / still experienced).
export function levelForCount(count: number): SkillLevel {
  if (count >= 8) return "master";
  if (count >= 5) return "experienced";
  if (count >= 2) return "growing";
  return "discovered";
}
