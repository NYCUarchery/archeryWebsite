import { describe, expect, it } from "vitest";
import type { DatabaseMatchResult } from "@/types/Api";
import { recurveClosingEnd } from "@/app/competition/[id]/scoring/@elimination/recurveClosingEnd";

function results(points: number[], arrows = 3): DatabaseMatchResult[] {
  return [0, 1].map((side) => ({
    match_ends: points.map((cumulative, index) => ({
      id: side * 100 + index,
      cumulative_points: side === 0 ? cumulative : 0,
      match_scores: Array.from({ length: arrows }, () => ({ score: side === 0 ? 10 : 9 })),
    })),
  }));
}

describe("recurve closing end", () => {
  it("keeps the first decisive end even if later ends were scored", () => {
    expect(recurveClosingEnd(results([2, 4, 6, 8]), 1)).toBe(2);
    expect(recurveClosingEnd(results([2, 4, 5, 7], 4), 2)).toBe(2);
    expect(recurveClosingEnd(results([2, 4, 5, 7], 6), 3)).toBe(2);
  });

  it("uses the last complete saved end for a manually selected winner", () => {
    const match = results([1, 3, 4]);
    match[1].match_ends![2].match_scores![0].score = -1;
    expect(recurveClosingEnd(match, 1)).toBe(1);
    match[1].match_ends![0].match_scores![0].score = -1;
    expect(recurveClosingEnd(match, 1)).toBeUndefined();
  });

  it("does not confirm malformed ends or extra regulation waves", () => {
    expect(recurveClosingEnd(results([2], 4), 1)).toBeUndefined();
    expect(recurveClosingEnd(results([1, 2, 3, 4, 5, 6]), 1)).toBe(4);
    expect(recurveClosingEnd(results([2]), 0)).toBeUndefined();
    expect(recurveClosingEnd([], 1)).toBeUndefined();
  });
});
