import { expect, type Page } from "@playwright/test";

/** Scores a complete six-arrow end through the judge editor and confirms it. */
export async function scoreJudgeQualificationEnd(page: Page, playerName: string, endIndex: number, scores: readonly ("10" | "9" | "8")[]) {
  const selector = page.getByLabel("選手姓名");
  await selector.fill(playerName);
  await page.getByRole("option", { name: playerName, exact: true }).click();
  const editor = page.getByTestId("qualification-score-editor-table");
  const editButtons = editor.getByRole("button", { name: /編輯第1局第[1-6]波分數/ });
  await editButtons.nth(endIndex).click();
  const dialog = page.getByRole("dialog", { name: "編輯分數" });
  for (const score of scores) await dialog.getByRole("button", { name: score, exact: true }).click();
  const saved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/all-endscores\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await dialog.getByRole("button", { name: "送出" }).click();
  expect((await saved).status()).toBe(200);
  await expect(dialog).toBeHidden();
  await editor.getByRole("button", { name: /編輯第1局第[1-6]波分數/ }).nth(endIndex).click();
  const confirmDialog = page.getByRole("dialog", { name: "編輯分數" });
  const confirmed = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/isconfirmed\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await confirmDialog.getByRole("button", { name: "確認" }).click();
  expect((await confirmed).status()).toBe(200);
  await expect(confirmDialog).toBeHidden();
  // Reopen once to make the server-confirmed state visible before selecting a
  // different archer; the table itself only renders score totals.
  await editor.getByRole("button", { name: /編輯第1局第[1-6]波分數/ }).nth(endIndex).click();
  await expect(page.getByRole("dialog", { name: "編輯分數" }).getByText("已確認（改分後維持確認）")).toBeVisible();
  await page.getByRole("dialog", { name: "編輯分數" }).getByRole("button", { name: "保留草稿並返回" }).click();
  await expect(page.getByRole("dialog", { name: "編輯分數" })).toBeHidden();
}

/** Advances the shared qualification end only after both groups are confirmed. */
export async function advanceQualification(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
  await page.getByRole("button", { name: "下一波" }).click();
  await expect(page.getByText("成功進到下一波")).toBeVisible();
}

export async function updateQualificationRanking(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
  const updated = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" &&
      path === `/api/competition/refresh/groups/players/rank/${competitionId}` &&
      candidate.status() === 200;
  });
  await page.getByRole("button", { name: "自動更新排名" }).click();
  await updated;
  await expect(page.getByText("自動更新排名成功", { exact: true })).toBeVisible();
}

export async function activateQualification(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/admin/schedule/activation`);
  const activation = page.getByRole("group", { name: "開啟賽程" });
  await activation.getByRole("button", { name: "資格賽" }).click();
  await expect(activation.getByRole("button", { name: "資格賽" })).toBeDisabled();
}

export async function scorePlayerQualificationEnd(page: Page, scores: readonly ("10" | "9" | "8")[]) {
  await page.locator(".player_button_group button").first().click();
  if (scores.length !== 6) throw new Error("qualification player scoring requires exactly six arrows");
  // Filling arrow six triggers the board's automatic save.  Observe it before
  // the explicit Send action so both writes have completed deterministically.
  const automaticallySaved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/all-endscores\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  for (const score of scores.slice(0, -1)) await page.getByRole("button", { name: score, exact: true }).click();
  await page.getByRole("button", { name: scores.at(-1)!, exact: true }).click();
  expect((await automaticallySaved).status()).toBe(200);
  const explicitlySaved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/all-endscores\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "送出" }).click();
  expect((await explicitlySaved).status()).toBe(200);
  await expect(page.getByText("已更新所有資料d(`･∀･)b")).toBeVisible();
  const confirmed = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/isconfirmed\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "確認" }).click();
  expect((await confirmed).status()).toBe(200);
  await expect(page.getByRole("button", { name: "已確認" })).toBeVisible();
}
