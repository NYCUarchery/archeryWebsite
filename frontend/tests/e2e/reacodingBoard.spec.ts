import { test, expect } from "@playwright/test";
import resetDB from "./resetDB";

test.describe("Recording Board", () => {
  test.beforeEach(async ({ page }) => {
    await resetDB();
    await page.goto("http://localhost/Login");
    await page.getByLabel("帳號").fill("1C");
    await page.getByLabel("密碼").fill("1c1c1c1c");

    await expect(
      await page.getByRole("button", { name: "登入" })
    ).not.toBeDisabled();
    await page.getByRole("button", { name: "登入" }).click();
    await expect(await page.getByText("公告欄")).toBeVisible();
    await page.goto("http://localhost/scoring/2");
    await page.getByRole("button", { name: "分" }).click();
    await page.getByRole("menuitem", { name: "紀錄分數" }).click();
  });

  test("Pre competiion prompt", async ({ page }) => {
    await page.goto("http://localhost/scoring/1");
    await page.getByRole("button", { name: "分" }).click();
    await page.getByRole("menuitem", { name: "紀錄分數" }).click();
    await expect(
      await page.getByRole("heading", {
        name: "還沒開始，我知道你很急但你先別急。",
      })
    ).toBeVisible();
  });
  test("Lane player names", async ({ page }) => {
    await expect(await page.getByText("吳柏橙")).toBeVisible();
    await expect(await page.getByText("蕭邦聿")).toBeVisible();
    await expect(
      await page
        .getByRole("button", { name: "✔ 李峻 9 9 9 7 6" })
        .getByText("李峻")
    ).toBeVisible();
    await expect(await page.getByText("盧均祐")).toBeVisible();
  });

  test("Score editing", async ({ page }) => {
    await unconfirm(page);

    await page.getByRole("button", { name: "- 李峻 9 9 9 7 6" }).click();
    for (let i = 0; i < 6; i++) {
      await page
        .locator("div")
        .filter({ hasText: /^確認$/ })
        .getByRole("button")
        .nth(1)
        .click();
    }
    await expect(page.getByRole("button", { name: "- 李峻" })).toBeVisible();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "7", exact: true }).click();
    await page.getByRole("button", { name: "6", exact: true }).click();
    await page.getByRole("button", { name: "4", exact: true }).click();

    await expect(
      await page.getByRole("button", { name: "- 李峻 9 9 9 7 6" })
    ).toBeVisible();
  });

  test("Confirmations", async ({ page }) => {
    {
      await unconfirm(page);
      let names = [
        "- 吳柏橙 9 9 8 7 6",
        "- 蕭邦聿 9 8 8 8 8",
        "- 李峻 9 9 9 7 6",
        "- 盧均祐 9 8 8 8 6",
      ];
      names = shuffleArray(names);

      for (const name of names) {
        await page.getByRole("button", { name: name }).click();
        await page.getByRole("button", { name: "確認" }).click();
        name.replace("-", "✔");
        await expect(
          await page.getByRole("button", { name: name })
        ).toBeVisible();
      }
    }
  });
  test("Score syncing", async ({ page }) => {
    {
      await unconfirm(page);
      await page.getByRole("button", { name: "- 吳柏橙 9 9 8 7 6" }).click();
      for (let i = 0; i < 6; i++) {
        await page
          .locator("div")
          .filter({ hasText: /^確認$/ })
          .getByRole("button")
          .nth(1)
          .click();
      }

      for (let i = 0; i < 3; i++) {
        await page.getByRole("button", { name: "6", exact: true }).click();
      }

      await page.goto("http://localhost/");
      await page.getByLabel("account of current user").click();
      await page.getByRole("menuitem", { name: "登出" }).click();
      await page.getByLabel("account of current user").click();
      await page.getByRole("menuitem", { name: "登入" }).click();
      await page.getByLabel("帳號").fill("1B");
      await page.getByLabel("密碼").fill("1b1b1b1b");
      await page.getByRole("button", { name: "登入" }).click();
      await expect(await page.getByText("公告欄")).toBeVisible();
      await page.goto("http://localhost/scoring/2");
      await page.getByRole("button", { name: "分" }).click();
      await page.getByRole("menuitem", { name: "紀錄分數" }).click();
      await expect(
        await page.getByRole("button", { name: "- 吳柏橙 6 6 6" })
      ).toBeVisible();
    }
  });

  test("Fuzzing", async ({ browser, page }) => {
    test.setTimeout(120000);
    const admin = await browser.newContext();
    const adminPage = await admin.newPage();

    await unconfirm(adminPage, true);
    adminPage.getByRole("tab", { name: "進度" }).click();
    page.goto("http://localhost/scoring/2");
    await page.getByRole("button", { name: "分" }).click();
    await page.getByRole("menuitem", { name: "紀錄分數" }).click();
    let users = [
      {
        buttonName: "- 吳柏橙",
        rowName: "91A吳柏橙",
        scores: [9, 9, 8, 7, 6, 5],
        totalScore: 710,
      },
      {
        buttonName: "- 蕭邦聿",
        rowName: "61B蕭邦聿",
        scores: [9, 8, 8, 8, 8, 7],
        totalScore: 827,
      },
      {
        buttonName: "- 李峻",
        rowName: "81C李峻",
        scores: [9, 9, 9, 7, 6, 4],
        totalScore: 727,
      },
      {
        buttonName: "- 盧均祐",
        rowName: "51D盧均祐",
        scores: [9, 8, 8, 8, 6, 6],
        totalScore: 830,
      },
    ];
    for (let i = 0; i < 10; i++) {
      users = shuffleArray(users);
      const user = users[0];
      user.scores = shuffleArray(user.scores);
      await page.getByRole("button", { name: user.buttonName }).click();
      for (let j = 0; j < 6; j++) {
        await page
          .locator("div")
          .filter({ hasText: /^確認$/ })
          .getByRole("button")
          .nth(1)
          .click();
      }
      for (let j = 0; j < 6; j++) {
        await page
          .getByRole("button", { name: user.scores[j].toString(), exact: true })
          .click();
      }
      updateScore(adminPage);
      await await page.getByRole("button", { name: "記" }).click();
      await page.getByRole("menuitem", { name: "分數榜" }).click();
      await expect(
        page.getByText(user.rowName).getByText(user.totalScore.toString())
      ).toBeVisible();
      await page.goto("http://localhost/scoring/2");
      await page.getByRole("button", { name: "分" }).click();
      await page.getByRole("menuitem", { name: "紀錄分數" }).click();
    }
  });
});

async function unconfirm(page, adminOnly = false) {
  await page.goto("http://localhost/");
  if (!adminOnly) {
    await page.getByLabel("account of current user").click();
    await page.getByRole("menuitem", { name: "登出" }).click();
  }
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登入" }).click();
  await page.getByLabel("帳號").fill("Oatmeal");
  await page.getByLabel("密碼").fill("Waaaaaaaa");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(await page.getByText("公告欄")).toBeVisible();
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.getByRole("menuitem", { name: "監控" }).click();
  await page.getByRole("tab", { name: "進度" }).click();
  await page.getByText("1C").click();
  await page.getByText("1B").click();
  await page.getByText("1A").click();
  await page.getByText("1D").click();
  if (adminOnly) return;
  await page.goto("http://localhost/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登出" }).click();
  await page.goto("http://localhost/Login");
  await page.getByLabel("帳號").fill("1C");
  await page.getByLabel("密碼").fill("1c1c1c1c");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(await page.getByText("公告欄")).toBeVisible();
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.getByRole("menuitem", { name: "紀錄分數" }).click();
}

async function updateScore(page) {
  await page.getByRole("button", { name: "更新排名" }).click();
}

function shuffleArray(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
