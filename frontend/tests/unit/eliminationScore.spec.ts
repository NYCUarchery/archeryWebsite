import { describe, expect, it } from "vitest";
import type { DatabaseMatchResult } from "@/types/Api";
import { isCompoundBowType, totalMatchScore } from "@/utils/eliminationScore";

describe("elimination score display", () => {
  it("recognizes both persisted compound bow-type values", () => {
    expect(isCompoundBowType("Compound")).toBe(true);
    expect(isCompoundBowType("複合弓")).toBe(true);
    expect(isCompoundBowType("Recurve")).toBe(false);
  });

  it("sums every compound wave, treating X as ten when a wave total is absent", () => {
    const result: DatabaseMatchResult = {
      match_ends: [
        { total_scores: 28 },
        { total_scores: 29 },
        { match_scores: [{ score: 11 }, { score: 10 }, { score: 9 }] },
      ],
    };

    expect(totalMatchScore(result)).toBe(86);
  });
});
