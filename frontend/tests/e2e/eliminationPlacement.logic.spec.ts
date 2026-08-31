import { expect, test } from "@playwright/test";
import {
  formatLanePlacement,
  isValidMatchPlacement,
  requiredTargetCount,
} from "../../src/utils/eliminationPlacement";
import { nextPowerOfTwo } from "../../src/utils/eliminationBracket";
import {
  hasEliminationMatchStarted,
  isBracketRosterLocked,
} from "../../src/utils/eliminationBracket";

test("靶位配置：0 隊、128 名額、兩種模式與手動形狀皆合契約", () => {
  expect(nextPowerOfTwo(0)).toBe(0);
  expect(nextPowerOfTwo(128)).toBe(128);
  expect(isBracketRosterLocked({})).toBe(false);
  expect(
    isBracketRosterLocked({ bracket_seed_count: 8, bracket_roster_locked: true })
  ).toBe(true);
  expect(
    isBracketRosterLocked({ bracket_seed_count: 8, stages: [{ id: 1 }] })
  ).toBe(false);
  expect(isBracketRosterLocked({ stages: [{ id: 1 }] })).toBe(true);
  expect(
    hasEliminationMatchStarted({
      match_results: [{ shoot_off_score: -1 }],
    })
  ).toBe(false);
  expect(
    hasEliminationMatchStarted({
      match_results: [{ shoot_off_score: 0 }],
    })
  ).toBe(true);
  expect(requiredTargetCount(4, "one_player_set_per_target")).toBe(8);
  expect(requiredTargetCount(4, "two_player_sets_per_target")).toBe(4);

  expect(
    isValidMatchPlacement([
      { match_result_id: 1, lane_number: 3, target: "A" },
      { match_result_id: 2, lane_number: 3, target: "B" },
    ])
  ).toBe(true);
  expect(
    isValidMatchPlacement([
      { match_result_id: 1, lane_number: 3, target: null },
      { match_result_id: 2, lane_number: 4, target: null },
    ])
  ).toBe(true);
  expect(
    isValidMatchPlacement([
      { match_result_id: 1, lane_number: 0, target: null },
      { match_result_id: 2, lane_number: 0, target: null },
    ])
  ).toBe(true);
  expect(
    isValidMatchPlacement([
      { match_result_id: 1, lane_number: 3, target: "A" },
      { match_result_id: 2, lane_number: 4, target: "B" },
    ])
  ).toBe(false);
  expect(formatLanePlacement(3, "A")).toBe("3A");
  expect(formatLanePlacement(0, null)).toBe("");
});
