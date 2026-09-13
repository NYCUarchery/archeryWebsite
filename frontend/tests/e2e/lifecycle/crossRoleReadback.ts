import { expect, type Page } from "@playwright/test";

type CurrentMatchReadback = {
  competitionId: number;
  eliminationId: number;
  winnerTeam: string;
  loserTeam: string;
  /** Individual uses three arrows; team uses six arrows. */
  teamSize: 1 | 3;
};

type PublicQualificationRanking = {
  competitionId: number;
  groupIndex: number;
  /** Caller supplies literal oracle rows; this helper never derives them from GET data. */
  rows: readonly { rank: number; name: string; total: number }[];
};

type EliminationReadback = {
  current_stage: number;
  current_end: number;
  player_sets: Array<{ id: number; set_name: string }>;
  stages: Array<{
    matchs: Array<{
      match_results: Array<{
        id: number;
        player_set_id: number;
        total_points: number;
        match_ends: Array<{
          is_confirmed: boolean;
          total_scores: number;
          match_scores: Array<{ score: number }>;
        }>;
      }>;
    }>;
  }>;
};

/**
 * Reads Archer 01's first qualification end through that player's own scoring
 * page after the Judge correction. LaneBoard renders the current end inside
 * each `.player_button_group` button, so every assertion stays in Archer 01's
 * card rather than matching another lane's identical score elsewhere.
 */
export async function assertArcher01ReadsConfirmedQualificationFirstEnd(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/scoring`);
  const archer = page.locator(".player_button_group button").filter({ hasText: "E2E Archer 01" });
  await expect(archer).toHaveCount(1);
  await expect(archer.locator(".score_block").allTextContents()).resolves.toEqual(["10", "10", "10", "10", "10", "10"]);
  await expect(archer.getByRole("heading", { level: 6 })).toHaveText("60");
  await expect(archer.getByText("✔", { exact: true })).toBeVisible();
}

/**
 * Opens the supplied Player context's scoring page after a Judge correction.
 * The player UI shows only the current end, so this checks only its visible
 * selected MatchResult, current arrows, current total and confirmation state.
 * Its selected MatchResult ID is cross-checked against official detail.
 */
export async function assertPlayerReadsConfirmedCurrentMatch(page: Page, options: CurrentMatchReadback) {
  await page.goto(`/competition/${options.competitionId}/scoring`);
  const arrows = options.teamSize === 1 ? 3 : 6;
  const winnerScores = Array.from({ length: arrows }, () => "10");
  const loserScores = Array.from({ length: arrows }, () => "9");
  const winnerTotal = options.teamSize === 1 ? 30 : 60;
  const loserTotal = options.teamSize === 1 ? 27 : 54;
  const board = page.locator(".elimination_board");
  await expect(board).toBeVisible();
  const sides = board.locator(".match_result_button_group .match_result_button");
  await expect(sides).toHaveCount(2);
  const winner = sides.filter({ has: page.locator(".name_bar", { hasText: options.winnerTeam }) });
  const loser = sides.filter({ has: page.locator(".name_bar", { hasText: options.loserTeam }) });
  await expect(winner).toHaveCount(1);
  await expect(loser).toHaveCount(1);
  await expect(winner.locator(".name_bar")).toHaveText(options.winnerTeam);
  await expect(loser.locator(".name_bar")).toHaveText(options.loserTeam);

  // The player page intentionally renders only the current end. Its selector
  // and ScoreController must therefore agree with that confirmed end.
  // Every caller is a member of winnerTeam. Do not click a side here: that
  // would hide a regression where the player board initially selects another
  // MatchResult.
  const selected = winner;
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(winner.locator(".score_block").allTextContents()).resolves.toEqual(winnerScores);
  await expect(loser.locator(".score_block").allTextContents()).resolves.toEqual(loserScores);
  await expect(winner.locator(".match_total_score")).toHaveText(String(winnerTotal));
  await expect(loser.locator(".match_total_score")).toHaveText(String(loserTotal));
  await expect(board.locator(".controll_button_group").getByRole("button", { name: "已確認", exact: true })).toBeVisible();

  // The page does not render historical ends or match points. Official detail
  // is used only to identify the current MatchResult selected by this player.
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${options.eliminationId}`);
  expect(response.ok()).toBeTruthy();
  const detail = await response.json() as EliminationReadback;
  const stage = detail.stages[detail.current_stage];
  expect(stage, "current elimination stage").toBeDefined();
  const setId = new Map(detail.player_sets.map((set) => [set.set_name, set.id]));
  const winnerId = setId.get(options.winnerTeam);
  const loserId = setId.get(options.loserTeam);
  expect(winnerId, "winner PlayerSet ID").toBeDefined();
  expect(loserId, "loser PlayerSet ID").toBeDefined();
  const match = stage!.matchs.find((candidate) => candidate.match_results.some((result) => result.player_set_id === winnerId) && candidate.match_results.some((result) => result.player_set_id === loserId));
  expect(match, "player's current match").toBeDefined();
  const selectedResult = match!.match_results.find((result) => result.player_set_id === winnerId);
  expect(selectedResult, "selected MatchResult").toBeDefined();
  expect(Number(await selected.getAttribute("value"))).toBe(selectedResult!.id);
  const currentEnd = selectedResult!.match_ends[detail.current_end];
  expect(currentEnd, "selected current MatchEnd").toBeDefined();
  expect(currentEnd!.is_confirmed).toBe(true);
  expect(currentEnd!.total_scores).toBe(winnerTotal);
  expect(currentEnd!.match_scores.map((score) => score.score)).toEqual(
    Array.from({ length: arrows }, () => 10),
  );
}

/**
 * Verifies all public qualification rows, including ranks 9–12 which are not
 * individually qualified but must remain visible on the public board.
 */
export async function assertPublicQualificationRanking(page: Page, options: PublicQualificationRanking) {
  expect(options.rows).toHaveLength(12);
  await page.goto(`/competition/${options.competitionId}/scoreboard/${options.groupIndex}/qualification`);
  const boardRows = page.locator(".qualification_board .ranking_info_bar");
  await expect(boardRows).toHaveCount(12);
  for (const [index, expected] of options.rows.entries()) {
    // RankingInfoBar has direct rank, target, name and total Grid children.
    // Exact columns avoid substring false-greens such as rank 1 matching 10.
    const columns = boardRows.nth(index).locator(":scope > *");
    await expect(columns).toHaveCount(4);
    await expect(columns.nth(0)).toHaveText(String(expected.rank));
    await expect(columns.nth(2)).toHaveText(expected.name);
    await expect(columns.nth(3)).toHaveText(String(expected.total));
  }
}
