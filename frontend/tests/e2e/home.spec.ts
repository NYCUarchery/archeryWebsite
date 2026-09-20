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
    let registrationRequestCount = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        new URL(request.url()).pathname === "/api/user"
      ) {
        registrationRequestCount += 1;
      }
    });
    await registerUser(page, user, "enter");
    expect(registrationRequestCount).toBe(1);
    await loginUser(page, user);
  });
  test("login", async ({ page }) => {
    await loginUser(page, new User("測試管理員", "e2e.admin", "archery-e2e-password", "e2e.admin@example.invalid"), "enter");
  });
  test("sidebar closes after navigating through a leaf item", async ({ page }) => {
    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "首頁" }).click();
    await expect(page.getByRole("button", { name: "首頁" })).not.toBeVisible();

    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "比賽" }).click();
    await expect(page.getByRole("button", { name: "近期比賽" })).toBeVisible();

    await page.getByRole("button", { name: "近期比賽" }).click();
    await expect(page).toHaveURL(/\/recent_competitions$/);
    await expect(page.getByRole("button", { name: "首頁" })).not.toBeVisible();
  });
  test("sidebar keeps open when expanding a parent item", async ({ page }) => {
    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "比賽" }).click();

    await expect(page.getByRole("button", { name: "近期比賽" })).toBeVisible();
    await expect(page.getByRole("button", { name: "首頁" })).toBeVisible();
    await expect(page.getByRole("button", { name: "我的比賽" })).toHaveCount(0);
  });
  test("authenticated My Competitions navigation closes the sidebar", async ({ page }) => {
    await loginUser(
      page,
      new User(
        "測試管理員",
        "e2e.admin",
        "archery-e2e-password",
        "e2e.admin@example.invalid",
      ),
    );
    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "比賽" }).click();
    await page.getByRole("button", { name: "我的比賽" }).click();

    await expect(page).toHaveURL(/\/my_competitions$/);
    await expect(page.getByRole("button", { name: "首頁" })).not.toBeVisible();
  });
  test("login locks duplicate Enter submissions while the request is pending", async ({ page }) => {
    await page.getByLabel("account of current user").click();
    await page.getByRole("menuitem", { name: "登入" }).click();
    await page.getByLabel("帳號").fill("e2e.admin");
    await page.getByLabel("密碼").fill("archery-e2e-password");

    let sessionRequestCount = 0;
    let notifySessionRequestStarted: () => void;
    let allowSessionRequest: () => void;
    const sessionRequestStarted = new Promise<void>((resolve) => {
      notifySessionRequestStarted = resolve;
    });
    const allowSessionResponse = new Promise<void>((resolve) => {
      allowSessionRequest = resolve;
    });
    await page.route(/\/api\/session\/?$/, async (route) => {
      sessionRequestCount += 1;
      notifySessionRequestStarted!();
      await allowSessionResponse;
      await route.continue();
    });

    await page.getByLabel("密碼").press("Enter");
    await sessionRequestStarted;
    await expect(page.getByRole("button", { name: "登入" })).toBeDisabled();
    await page.getByLabel("密碼").press("Enter");
    await expect.poll(() => sessionRequestCount).toBe(1);
    allowSessionRequest!();
    await expect(page.getByText("公告欄")).toBeVisible();
  });
  test("overview Enter adds a new line without submitting registration", async ({ page }) => {
    await page.getByLabel("account of current user").click();
    await page.getByRole("menuitem", { name: "登入" }).click();
    await page.getByRole("button", { name: "沒有帳號嗎？" }).click();

    let registrationRequestCount = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /^\/api\/user\/?$/.test(new URL(request.url()).pathname)
      ) {
        registrationRequestCount += 1;
      }
    });
    const overview = page.getByLabel("自我介紹");
    await overview.press("Enter");
    await expect(overview).toHaveValue("\n");
    expect(registrationRequestCount).toBe(0);
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("button", { name: "註冊" })).toBeVisible();
  });
  test("password mismatch Enter shows the existing alert without registering", async ({ page }) => {
    await page.getByLabel("account of current user").click();
    await page.getByRole("menuitem", { name: "登入" }).click();
    await page.getByRole("button", { name: "沒有帳號嗎？" }).click();
    await page.getByLabel("密碼", { exact: true }).fill("first-password");
    await page.getByLabel("確認密碼").fill("different-password");

    let registrationRequestCount = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /^\/api\/user\/?$/.test(new URL(request.url()).pathname)
      ) {
        registrationRequestCount += 1;
      }
    });
    const alertHandled = new Promise<void>((resolve) => {
      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toBe("密碼不一致");
        await dialog.accept();
        resolve();
      });
    });
    await page.getByLabel("確認密碼").press("Enter");
    await alertHandled;

    expect(registrationRequestCount).toBe(0);
    await expect(page).toHaveURL(/\/register$/);
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
