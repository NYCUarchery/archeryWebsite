import { expect, test } from "../fixtures";
import { manualScreenshot } from "../manualScreenshot";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "../eliminationFixtures";
import type { EliminationFixture } from "../eliminationFixtures";
import type {
  DatabaseMatch,
  DatabaseMatchEnd,
  DatabaseMatchResult,
  DatabaseMatchScore,
  DatabasePlayer,
  DatabasePlayerSet,
  DatabaseStage,
} from "@/types/Api";


// GameTitleBar chooses a random greeting; keep documentation images stable.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
});

function buildManualBracketShowcase(
  fixture: ReturnType<typeof buildEliminationFixture>,
) {
  const names = Array.from({ length: 8 }, (_, index) =>
    `選手 ${String(index + 1).padStart(2, "0")}`,
  );
  const seeds = [1, 8, 4, 5, 3, 6, 2, 7];
  const players: DatabasePlayer[] = names.map((name, index) => ({
    id: 9510 + index,
    group_id: fixture.elimination.group_id,
    participant_id: 9700 + index,
    name,
    order: index + 1,
    rank: seeds[index],
    total_score: 700 - seeds[index] * 3,
  }));
  const playerSets: DatabasePlayerSet[] = players.map((player, index) => ({
    id: 9500 + index,
    elimination_id: fixture.eliminationId,
    rank: seeds[index],
    set_name: player.name,
    total_score: player.total_score,
    players: [player],
  }));
  const stagePairings: Array<Array<[number, number]>> = [
    [[0, 1], [2, 3], [4, 5], [6, 7]],
    [[0, 2], [4, 6]],
    [[0, 4], [2, 6]],
  ];
  const winnerArrows = [
    [11, 10, 9],
    [10, 9, 10],
    [10, 10, 9],
    [9, 10, 10],
    [10, 9, 9],
  ];
  const opponentArrows = [
    [9, 8, 8],
    [8, 9, 8],
    [9, 9, 8],
    [8, 8, 9],
    [9, 8, 9],
  ];
  let matchIndex = 0;
  const stages: DatabaseStage[] = stagePairings.map((pairings, stageIndex) => {
    const stageId = 9971 + stageIndex;
    const matchs: DatabaseMatch[] = pairings.map((pairing) => {
      const matchId = fixture.matchId + matchIndex;
      const match_results: DatabaseMatchResult[] = pairing.map((playerSetIndex, sideIndex) => {
        const resultId = 10000 + matchIndex * 2 + sideIndex;
        let cumulativePoints = 0;
        const match_ends: DatabaseMatchEnd[] = Array.from({ length: 5 }, (_, endIndex) => {
          const endId = 20000 + matchIndex * 10 + sideIndex * 5 + endIndex;
          const isShootOffMatch = matchIndex === 0;
          const points = isShootOffMatch
            ? 1
            : sideIndex === 0
              ? (endIndex < 4 ? 2 : 0)
              : (endIndex === 4 ? 2 : 0);
          cumulativePoints += points;
          const arrowValues = sideIndex === 0
            ? winnerArrows[endIndex]
            : opponentArrows[endIndex];
          const match_scores: DatabaseMatchScore[] = arrowValues.map((score, arrowIndex) => ({
            id: 30000 + matchIndex * 100 + sideIndex * 15 + endIndex * 3 + arrowIndex,
            match_end_id: endId,
            score,
          }));
          return {
            id: endId,
            match_result_id: resultId,
            is_confirmed: true,
            points,
            cumulative_points: cumulativePoints,
            total_scores: arrowValues.reduce(
              (total, score) => total + (score === 11 ? 10 : score),
              0,
            ),
            match_scores,
          };
        });
        return {
          id: resultId,
          is_winner: sideIndex === 0,
          lane_number: sideIndex === 0 ? 3 : 5,
          match_id: matchId,
          player_set_id: playerSets[playerSetIndex].id,
          shoot_off_score: matchIndex === 0 && sideIndex === 0 ? 10 : -1,
          total_points: cumulativePoints,
          match_ends,
        };
      });
      const match: DatabaseMatch = {
        id: matchId,
        stage_id: stageId,
        outcome_status: "winner",
        match_results,
      };
      matchIndex += 1;
      return match;
    });
    return { id: stageId, elimination_id: fixture.eliminationId, matchs };
  });

  const expectedMatchesPerStage = [4, 2, 2];
  stages.forEach((stage, stageIndex) => {
    const matchs = stage.matchs ?? [];
    if (matchs.length !== expectedMatchesPerStage[stageIndex]) {
      throw new Error("手冊對抗賽樣本的階段場數不正確");
    }
    const stagePlayerSetIds = matchs.flatMap((match) =>
      (match.match_results ?? []).map((result) => result.player_set_id),
    );
    if (stagePlayerSetIds.length !== matchs.length * 2 || new Set(stagePlayerSetIds).size !== stagePlayerSetIds.length) {
      throw new Error("手冊對抗賽樣本每階段須有唯一選手及兩方 MatchResult");
    }
    for (const match of matchs) {
      if (match.match_results?.length !== 2) {
        throw new Error("手冊對抗賽樣本每場須有兩方 MatchResult");
      }
      for (const result of match.match_results) {
        const ends = result.match_ends ?? [];
        if (ends.length !== 5 || ends.some((end) =>
          end.match_scores?.length !== 3 || end.match_scores.some((score) => (score.score ?? -1) < 0),
        )) {
          throw new Error("手冊對抗賽樣本每方須有五局完整箭分");
        }
      }
    }
  });

  const group = fixture.groupsWithPlayers.groups.find(
    (item) => item.id === fixture.elimination.group_id,
  );
  if (!group) throw new Error("手冊對抗賽樣本缺少正式組別");
  group.players = players;
  fixture.elimination.player_sets = playerSets;
  fixture.elimination.stages = stages;
}

function prepareManualFixture(fixture: EliminationFixture) {
  fixture.competition.title = "2026 射箭公開賽";
  fixture.competition.groups?.forEach((group) => { group.group_name = "公開男子反曲弓組"; });
  fixture.groupsWithPlayers.groups.forEach((group) => { group.group_name = "公開男子反曲弓組"; });
  fixture.eliminationsByGroup.group_data.forEach((group) => { group.group_name = "公開男子反曲弓組"; });
  fixture.user.real_name = "選手 01";
  const [mine, opponent] = fixture.elimination.player_sets ?? [];
  if (!mine || !opponent) throw new Error("手冊樣本缺少雙方選手");
  mine.set_name = fixture.setNameMine = "選手 01";
  opponent.set_name = fixture.setNameOpponent = "選手 02";
  mine.players?.forEach((player) => { player.name = "選手 01"; });
  opponent.players?.forEach((player) => { player.name = "選手 02"; });
}

function confirmFirstJudgeMatch(fixture: EliminationFixture) {
  const [mine, opponent] = fixture.elimination.stages?.[0].matchs?.[0].match_results ?? [];
  if (!mine || !opponent) throw new Error("手冊樣本缺少雙方 MatchResult");
  for (const [result, scores, points] of [
    [mine, [11, 10, 9], 2],
    [opponent, [9, 8, 8], 0],
  ] as const) {
    const end = result.match_ends?.[0];
    if (!end || end.match_scores?.length !== scores.length) {
      throw new Error("手冊樣本每方須有三支箭");
    }
    end.match_scores.forEach((arrow, index) => { arrow.score = scores[index]; });
    end.is_confirmed = true;
    end.total_scores = scores.reduce((sum, score) => sum + (score === 11 ? 10 : score), 0);
    end.points = points;
    end.cumulative_points = points;
    result.total_points = points;
  }
}

test("選手記錄個人對抗賽分數", async ({ page }) => {
  const fixture = buildEliminationFixture("individual", { targets: ["A", "B"] });
  prepareManualFixture(fixture);
  await registerEliminationRoutes(page, fixture);
  await page.goto(`/competition/${fixture.competitionId}/scoring`);
  await expect(page.getByText("3A", { exact: true })).toBeVisible();
  await manualScreenshot(page, "player/elimination-scoring", { mobile: true });
  const scoreNine = page.getByRole("button", { name: "9", exact: true });
  for (let arrow = 0; arrow < 3; arrow++) await scoreNine.click();
  await expect(page.locator(".controll_button_group").getByRole("button", { name: "確認", exact: true })).toBeEnabled();
  await manualScreenshot(page, "player/elimination-scoring-filled", { mobile: true });
});

test("選手查看完整對抗樹及比分詳情", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  prepareManualFixture(fixture);
  buildManualBracketShowcase(fixture);
  await registerEliminationRoutes(page, fixture);
  await page.goto(`/competition/${fixture.competitionId}/scoreboard/0/elimination/1`);
  const team = page.getByRole("button", { name: /選手 01.*Match #9402/ }).first();
  await expect(team).toBeVisible();
  await manualScreenshot(page, "player/public-elimination-bracket", { mobile: true });
  await team.click({ position: { x: 190, y: 15 } });
  const dialog = page.getByRole("dialog", { name: /比分詳細資料/ });
  await expect(dialog.locator("[data-testid^=match-score-end-row-]")).toHaveCount(5);
  await manualScreenshot(page, "player/public-elimination-detail", { mobile: true });
});

test("裁判查看對抗賽並編輯已確認分數", async ({ page }) => {
  const fixture = buildEliminationFixture("individual", { targets: ["A", "B"] });
  prepareManualFixture(fixture);
  fixture.participants[0].role = "Judge";
  fixture.participants[0].status = "approved";
  confirmFirstJudgeMatch(fixture);
  await registerEliminationRoutes(page, fixture);
  await page.goto(`/competition/${fixture.competitionId}/judge`);
  const match = page.getByRole("button", { name: /Match 1/ });
  await expect(match).toContainText("選手 01");
  await expect(match).toContainText("選手 02");
  await manualScreenshot(page, "judge/match-list", { mobile: true });
  await match.click();
  await expect(page.getByTestId("match-score-end-row-1")).toContainText("第 1 波");
  await manualScreenshot(page, "judge/match-detail", { mobile: true });
  const confirmedCell = page.locator('[data-status="confirmed"]:visible').first();
  await confirmedCell.getByRole("button", { name: "編輯本波分數" }).click();
  await expect(page.getByText("已確認（改分後維持確認）")).toBeVisible();
  await manualScreenshot(page, "judge/edit-confirmed-score", { mobile: true });
});

test("管理員查看建立完整對抗樹設定", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  prepareManualFixture(fixture);
  fixture.elimination.stages = [];
  fixture.elimination.player_sets?.forEach((playerSet) => { playerSet.rank = 0; });
  fixture.elimination.player_sets?.push(
    ...[0, 1, 2].map((offset) => ({
      id: 9700 + offset,
      elimination_id: fixture.eliminationId,
      set_name: `選手 ${String(offset + 3).padStart(2, "0")}`,
      rank: 0,
      players: [],
    })),
  );
  await registerEliminationRoutes(page, fixture);
  await page.goto(`/competition/${fixture.competitionId}/admin/schedule/elimination/1`);
  await page.getByRole("button", { name: "建立完整對抗樹" }).click();
  const dialog = page.getByRole("dialog", { name: "建立完整對抗樹" });
  await dialog.getByLabel("晉級數").fill("4");
  await expect(dialog.getByText("建立後第一階段會保持空白；請在對抗表中依隊伍排名手動更新。"))
    .toBeVisible();
  await manualScreenshot(page, "admin/create-elimination-bracket");
});
