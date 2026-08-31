import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { EliminationFixture } from "./eliminationFixtures";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";

// 12 種可能分數之顯示 label：X(11)、10..1、M(0)。與 EliminationScoringBoard 之 POSSIBLE_SCORES 對應。
const ALL_SCORE_LABELS = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];

async function gotoEliminationScoring(page: Page, competitionId: number) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(`${baseUrl}/competition/${competitionId}/scoring`);
}

// 分數鈕：以按鈕文字（X/M/數字）精確比對，避免 "1" 誤配到 "10"。
function scoreButton(page: Page, label: string) {
  return page.getByRole("button", { name: label, exact: true });
}

// 控制鈕群（確認／送出／刪除）：ControllButtonGroup 之 className。
function controlGroup(page: Page) {
  return page.locator(".controll_button_group");
}

// 雙方切換鈕群：MatchResultSelector 之 className。
function selectorGroup(page: Page) {
  return page.locator(".match_result_button_group");
}

// 某一方之切換鈕：鈕內含隊名、波總分與各箭 ScoreBlock（仿資格賽 PlayerInfoBar）。
function sideButton(page: Page, setName: string) {
  return selectorGroup(page)
    .locator(".match_result_button")
    .filter({ hasText: setName });
}

// 某一方鈕內之各箭分數文字（DESC 排列；未填格之 ScoreBlock 顯示 "-1"）。
async function sideScoreLabels(page: Page, setName: string): Promise<string[]> {
  const labels = await sideButton(page, setName)
    .locator(".match_score_bar > *")
    .allTextContents();
  return labels.map((label) => label.trim());
}

// 某一方鈕內之波總分。
function sideTotal(page: Page, setName: string) {
  return sideButton(page, setName).locator(".match_total_score");
}

// 等待記分板就緒（雙方資料已載入、可看到雙方切換鈕）。
async function waitReady(page: Page, fixture: EliminationFixture) {
  await expect(sideButton(page, fixture.setNameMine)).toBeVisible();
}

test.describe("Elimination Scoring Board", () => {
  test("個人賽：同靶位 A/B 配置於記分頁標頭顯示", async ({ page }) => {
    const fixture = buildEliminationFixture("individual", {
      targets: ["A", "B"],
    });
    await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    await expect(page.getByText("3A", { exact: true })).toBeVisible();
    await expect(page.getByText("3B", { exact: true })).toBeVisible();
  });

  test("個人賽：第 3 箭後所有分數鈕停用，快速連點不產生第 4 箭", async ({ page }) => {
    const fixture = buildEliminationFixture("individual");
    await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    await scoreButton(page, "9").click();
    await scoreButton(page, "9").click();
    await scoreButton(page, "9").click();

    // 已達容量上限（3 箭），所有可能分數鈕皆應停用。
    for (const label of ALL_SCORE_LABELS) {
      await expect(scoreButton(page, label)).toBeDisabled();
    }

    // 快速連點（force 略過原生 disabled 之可操作性檢查，模擬使用者手速快於畫面更新）：
    // ScoreController/reducer 之容量檢查應直接拒絕，不會新增第 4 箭。
    for (let i = 0; i < 5; i++) {
      await scoreButton(page, "9").click({ force: true });
    }
    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["9", "9", "9"]);
    await expect(sideTotal(page, fixture.setNameMine)).toHaveText("27");
  });

  test("混雙賽：第 4 箭後不能再輸入", async ({ page }) => {
    const fixture = buildEliminationFixture("mixed");
    await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    for (let i = 0; i < 4; i++) {
      await scoreButton(page, "8").click();
    }
    for (const label of ALL_SCORE_LABELS) {
      await expect(scoreButton(page, label)).toBeDisabled();
    }
    await scoreButton(page, "8").click({ force: true });
    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["8", "8", "8", "8"]);
  });

  test("團體賽：第 6 箭後不能再輸入", async ({ page }) => {
    const fixture = buildEliminationFixture("team");
    await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    for (let i = 0; i < 6; i++) {
      await scoreButton(page, "7").click();
    }
    for (const label of ALL_SCORE_LABELS) {
      await expect(scoreButton(page, label)).toBeDisabled();
    }
    await scoreButton(page, "7").click({ force: true });
    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["7", "7", "7", "7", "7", "7"]);

    // 團體賽全員姓名應完整顯示。
    await expect(page.getByText("我方選手1、我方選手2、我方選手3")).toBeVisible();
  });

  test("排序：依序輸入 7、10、8 顯示為 10、8、7，重新整理後仍遞減", async ({
    page,
  }) => {
    const fixture = buildEliminationFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    await scoreButton(page, "7").click();
    await scoreButton(page, "10").click();
    await scoreButton(page, "8").click();

    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["10", "8", "7"]);
    await expect(sideTotal(page, fixture.setNameMine)).toHaveText("25");

    // 填滿容量（3 箭）應自動觸發存分。
    await expect.poll(() => handles.savedScoreRequests.length).toBe(1);
    const savedBody = handles.savedScoreRequests[0].body as {
      match_score_ids: number[];
      scores: number[];
      total_scores: number;
    };
    expect(savedBody.scores).toEqual([10, 8, 7]);
    expect(savedBody.total_scores).toBe(25);
    // id↔score 一一對應：依填格演算法（見契約 §2），排序後之 id 順序應為
    // [第2次填格之id, 第3次填格之id, 第1次填格之id]。
    expect(savedBody.match_score_ids).toEqual([
      fixture.myMatchScoreIds[1],
      fixture.myMatchScoreIds[2],
      fixture.myMatchScoreIds[0],
    ]);

    // 重新整理後，資料重新自（已更新的）伺服器狀態載入，順序仍應遞減。
    await page.reload();
    await waitReady(page, fixture);
    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["10", "8", "7"]);
  });

  test("存分：手動送出時 payload 含正確 match_score_ids/scores/total_scores 且 id↔score 對應，未滿容量不會自動存", async ({
    page,
  }) => {
    const fixture = buildEliminationFixture("team"); // 容量 6，便於測試「未滿容量」情境
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    await scoreButton(page, "9").click();
    await scoreButton(page, "6").click();

    // 僅填 2 箭（容量 6），不應自動觸發存分。
    await expect.poll(() => handles.savedScoreRequests.length).toBe(0);

    await controlGroup(page).getByRole("button", { name: "送出", exact: true }).click();
    await expect.poll(() => handles.savedScoreRequests.length).toBe(1);

    const body = handles.savedScoreRequests[0].body as {
      match_score_ids: number[];
      scores: number[];
      total_scores: number;
    };
    expect(body.match_score_ids).toHaveLength(6);
    expect(body.scores).toHaveLength(6);
    // 已填兩箭依 DESC 排序為 [9, 6]，其餘 4 格為 -1 佔位（Scorefmt 折算為 0）。
    expect(body.scores).toEqual([9, 6, -1, -1, -1, -1]);
    expect(body.total_scores).toBe(15);

    // id↔score 一一對應：分數 9 與 6 各自對應到第 1、第 2 個填入之分數格 id。
    const idForNine = body.match_score_ids[body.scores.indexOf(9)];
    const idForSix = body.match_score_ids[body.scores.indexOf(6)];
    expect(idForNine).toBe(fixture.myMatchScoreIds[0]);
    expect(idForSix).toBe(fixture.myMatchScoreIds[1]);
  });

  test("確認：只呼叫 isconfirmed 端點，不觸發存分／積點／勝負／推進局數等其他 API；確認後不可增刪；不會自動確認對手", async ({
    page,
  }) => {
    const fixture = buildEliminationFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    // 先填滿並等待自動存分完成（此為正常存分流程，非本測試監控重點）。
    await scoreButton(page, "9").click();
    await scoreButton(page, "9").click();
    await scoreButton(page, "9").click();
    await expect.poll(() => handles.savedScoreRequests.length).toBe(1);
    const scoreCallsBeforeConfirm = handles.savedScoreRequests.length;

    await controlGroup(page).getByRole("button", { name: "確認", exact: true }).click();
    await expect(controlGroup(page).getByRole("button", { name: "已確認" })).toBeVisible();

    expect(handles.confirmRequests).toHaveLength(1);
    expect(handles.confirmRequests[0].body).toEqual({ is_confirmed: true });
    // 確認過程未新增任何存分呼叫，也未呼叫積點／勝負／推進局數等其他端點。
    expect(handles.savedScoreRequests).toHaveLength(scoreCallsBeforeConfirm);
    expect(handles.forbiddenRequests).toHaveLength(0);

    // 確認後：本方分數鈕與刪除鈕皆應停用（不可增刪）。
    for (const label of ALL_SCORE_LABELS) {
      await expect(scoreButton(page, label)).toBeDisabled();
    }
    await expect(controlGroup(page).getByRole("button").last()).toBeDisabled();

    // 切換到對手側，對手不應被自動確認，仍可編輯。
    await selectorGroup(page)
      .getByRole("button", { name: fixture.setNameOpponent })
      .click();
    // 對手側未被自動確認：控制鈕群仍顯示可按之「確認」而非「已確認」。
    await expect(
      controlGroup(page).getByRole("button", { name: "確認", exact: true })
    ).toBeVisible();
    await expect(scoreButton(page, "9")).toBeEnabled();
  });

  test("錯誤狀態：存分失敗時保留本地已輸入分數並提示失敗", async ({ page }) => {
    const fixture = buildEliminationFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    handles.setScoresShouldFail(true);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    await scoreButton(page, "9").click();
    await scoreButton(page, "9").click();
    await controlGroup(page).getByRole("button", { name: "送出", exact: true }).click();

    await expect(page.getByText("儲存分數失敗，請稍後再試")).toBeVisible();
    // 失敗時應保留本地已輸入之分數，不回滾（第 3 格仍為未填之 "-"）。
    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["9", "9", "-1"]);
  });

  test("錯誤狀態：確認失敗時仍可編輯本波分數", async ({ page }) => {
    const fixture = buildEliminationFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    // 確認前必須先讓本波分數成功存過一次（否則會被前端「尚未儲存不可確認」之守衛擋下，
    // 根本不會呼叫確認 API），故先手動存分成功，再讓確認 API 本身失敗。
    await scoreButton(page, "9").click();
    await scoreButton(page, "9").click();
    await controlGroup(page).getByRole("button", { name: "送出", exact: true }).click();
    await expect.poll(() => handles.savedScoreRequests.length).toBe(1);

    handles.setConfirmShouldFail(true);
    await controlGroup(page).getByRole("button", { name: "確認", exact: true }).click();
    await expect(page.getByText("確認失敗，請稍後再試")).toBeVisible();

    // 確認失敗，isConfirmed 仍為 false，應仍可新增分數（證明未被鎖定）。
    await scoreButton(page, "7").click();
    await expect
      .poll(() => sideScoreLabels(page, fixture.setNameMine))
      .toEqual(["9", "9", "7"]);
  });

  test("找不到對局：顯示明確中文提示", async ({ page }) => {
    const fixture = buildEliminationFixture("individual", { noMatch: true });
    await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);

    await expect(page.getByText("目前尚未安排您的對局。")).toBeVisible();
  });

  test("輪詢：每兩秒依賽事 phase 離開並返回對抗賽畫面", async ({ page }) => {
    const fixture = buildEliminationFixture("individual");
    const routes = await registerEliminationRoutes(page, fixture);
    await gotoEliminationScoring(page, fixture.competitionId);
    await waitReady(page, fixture);

    routes.setCompetitionPhase(0);
    await expect(sideButton(page, fixture.setNameMine)).not.toBeVisible({
      timeout: 3500,
    });

    routes.setCompetitionPhase(1);
    await expect(sideButton(page, fixture.setNameMine)).toBeVisible({
      timeout: 3500,
    });
  });
});
