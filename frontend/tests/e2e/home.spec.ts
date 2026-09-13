import { test, expect } from "./fixtures";
import { User } from "./data";
import { loginUser, logoutUser, registerUser } from "./utils";
import { applyToLegacyCompetition, legacyCompetition, legacyTitles } from "./legacy";

test.use({ databaseFixture: "legacy" });

test.describe("Home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });
  test("Register", async ({ page }) => {
    const user = new User("測試註冊者", "home-register", "home-register-password", "home-register@example.invalid");
    await registerUser(page, user);
    await loginUser(page, user);
  });
  test("login", async ({ page }) => {
    await loginUser(page, new User("測試管理員", "e2e.admin", "archery-e2e-password", "e2e.admin@example.invalid"));
  });
  test("apply to competition as player", async ({ page }) => {
    const user = new User("選手申請者", "home-player", "home-player-password", "home-player@example.invalid");
    const competition = await legacyCompetition(page, legacyTitles.qualificationFinished);
    await registerUser(page, user);
    await loginUser(page, user);
    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "比賽" }).click();
    await page.getByRole("button", { name: "近期比賽" }).click();
    await applyToLegacyCompetition(page, competition.id, "選手");
    await expect(page.getByText("申請成功!")).toBeVisible();
    await logoutUser(page);
  });
  test("apply to competition as judge", async ({ page }) => {
    const judge = new User("裁判申請者", "home-judge", "home-judge-password", "home-judge@example.invalid");
    const competition = await legacyCompetition(page, legacyTitles.qualificationFinished);
    await registerUser(page, judge);
    await loginUser(page, judge);
    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "比賽" }).click();
    await page.getByRole("button", { name: "近期比賽" }).click();
    await applyToLegacyCompetition(page, competition.id, "裁判");
    await expect(page.getByText("申請成功!")).toBeVisible();
    await logoutUser(page);
  });
});
