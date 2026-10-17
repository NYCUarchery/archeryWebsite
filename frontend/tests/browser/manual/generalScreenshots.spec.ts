import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { manualScreenshot } from "../manualScreenshot";


// GameTitleBar chooses a random greeting; keep documentation images stable.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
});

const title = "2026 射箭公開賽";
const competitionId = 9850;
const adminId = 9851;

async function guest(page: Page) {
  await page.route("**/api/user/me", (route) =>
    route.fulfill({ status: 401, json: { error: "unauthorized" } }),
  );
}

async function identity(page: Page, role: "Player" | "Dictator" | "Admin") {
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: 12 } }));
  await page.route("**/api/user/12", (route) =>
    route.fulfill({ json: { id: 12, real_name: role === "Player" ? "選手 01" : "管理員", role } }),
  );
}

const competition = (id: number) => ({ id, title: `${title} ${id}`, sub_title: "公開男子反曲弓組" });

async function currentCompetitions(page: Page, ids: number[]) {
  await page.route("**/api/competition/current/**", (route) =>
    route.fulfill({ json: ids.map(competition), headers: { "X-Total-Count": String(ids.length) } }),
  );
}

test("選手：登入及註冊", async ({ page }) => {
  await guest(page);
  await page.route("**/api/institution", (route) =>
    route.fulfill({ json: [{ id: 1, name: "示範學校" }] }),
  );
  await page.goto("/bulk_register");
  await expect(page).toHaveURL(/\/login\?next=\/bulk_register$/);
  await manualScreenshot(page, "player/login", { mobile: true });
  await page.getByRole("button", { name: "沒有帳號嗎？" }).click();
  await expect(page.getByLabel("真實姓名")).toBeVisible();
  await manualScreenshot(page, "player/register", { mobile: true, fullPage: true });
});

test("選手：首頁", async ({ page }) => {
  await guest(page);
  await page.route("**/api/competition/current/0/2", (route) =>
    route.fulfill({ json: [], headers: { "X-Total-Count": "0" } }),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "目前沒有近期比賽" })).toBeVisible();
  await manualScreenshot(page, "player/home", { mobile: true });
});

test("選手：比賽列表", async ({ page }) => {
  await guest(page);
  await currentCompetitions(page, [1, 2, 3, 4, 5]);
  await page.goto("/recent_competitions");
  await expect(page.locator(".home-competition-list article")).toHaveCount(5);
  await manualScreenshot(page, "player/competition-list", { mobile: true });
});

test("選手：申請加入比賽", async ({ page }) => {
  await identity(page, "Player");
  await currentCompetitions(page, [1]);
  await page.goto("/recent_competitions");
  await page.getByRole("button", { name: "申請加入", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "選擇申請角色" })).toBeVisible();
  await manualScreenshot(page, "player/competition-application", { mobile: true });
});

test("管理員：我的比賽及建立比賽", async ({ page }) => {
  await identity(page, "Dictator");
  await page.route("**/api/competition/user/12/0/4", (route) =>
    route.fulfill({ json: [], headers: { "X-Total-Count": "0" } }),
  );
  await page.route("**/api/institution", (route) => route.fulfill({ json: [] }));
  await page.goto("/my_competitions");
  await expect(page.getByRole("button", { name: "創建新的比賽" })).toBeVisible();
  await manualScreenshot(page, "admin/my-competitions");
  await page.getByRole("button", { name: "創建新的比賽" }).click();
  await expect(page.getByLabel("比賽名稱")).toBeVisible();
  await manualScreenshot(page, "admin/create-competition");
});

test("管理員：批次註冊預覽", async ({ page }) => {
  await identity(page, "Dictator");
  await page.route("**/api/competition", (route) =>
    route.fulfill({ json: [{ id: 7, title: "秋季賽" }] }),
  );
  await page.route("**/api/user/bulk/preview", (route) => route.fulfill({
    json: { count: 1, rows: [{ line: 2, user_name: "arch-001", real_name: "選手 01" }], errors: [] },
  }));
  await page.goto("/bulk_register");
  await page.getByLabel("賽事").click();
  await page.getByRole("option", { name: "秋季賽" }).click();
  await page.getByLabel("帳號前綴").fill("arch-");
  await page.getByLabel("CSV").fill("user_name,real_name,password\n001,選手 01,password123");
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByText("第 2 行：arch-001／選手 01")).toBeVisible();
  await manualScreenshot(page, "admin/bulk-register-preview");
});

const progressCompetition = {
  id: competitionId,
  title,
  host_id: adminId,
  rounds_num: 6,
  unassigned_group_id: 1,
  groups_num: 0,
  unassigned_lane_id: 1,
  lanes_num: 4,
  current_phase: 0,
  qualification_current_end: 0,
  qualification_is_active: true,
  elimination_is_active: false,
  team_elimination_is_active: false,
  mixed_elimination_is_active: false,
  script: "",
  groups: [],
};

async function adminCompetition(page: Page, data: Record<string, unknown>, userId = adminId) {
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: userId } }));
  await page.route(`**/api/user/${userId}`, (route) =>
    route.fulfill({ json: { id: userId, real_name: "管理員", role: "Admin" } }),
  );
  await page.route(`**/api/participant/competition/user/${competitionId}/${userId}`, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(`**/api/competition/groups/${competitionId}`, (route) =>
    route.fulfill({ json: data }),
  );
  await page.route(`**/api/competition/groups/players/${competitionId}`, (route) =>
    route.fulfill({ json: { groups: data.groups } }),
  );
}

test("管理員：資格賽進度", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await adminCompetition(page, progressCompetition);
  const lanes = Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    competition_id: competitionId,
    qualification_id: 1,
    lane_number: index + 1,
    players: [],
  }));
  await page.route(`**/api/lane/all/${competitionId}`, (route) => route.fulfill({ json: lanes }));
  for (const lane of lanes.slice(1)) {
    await page.route(`**/api/lane/scores/${lane.id}`, (route) => route.fulfill({ json: {
      id: lane.id,
      players: Array.from({ length: 4 }, (_, index) => ({
        id: lane.id * 10 + index,
        order: index + 1,
        rounds: [{ id: lane.id * 100 + index, round_ends: Array.from({ length: 6 }, (_, endIndex) => ({
          id: lane.id * 1000 + index * 10 + endIndex,
          is_confirmed: false,
          round_scores: [],
        })) }],
      })),
    } }));
  }
  await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
  await expect(page.getByTestId("lane-block-2")).toBeVisible();
  await manualScreenshot(page, "admin/qualification-progress");
});

test("管理員：參賽申請核准", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await adminCompetition(page, { id: competitionId, title, sub_title: "公開男子反曲弓組", groups: [] });
  await page.route(`**/api/participant/competition/user/${competitionId}/${adminId}`, (route) =>
    route.fulfill({ json: [{ id: 9871, competition_id: competitionId, user_id: adminId, role: "Admin", status: "approved" }] }),
  );
  await page.route(`**/api/participant/competition/${competitionId}`, (route) =>
    route.fulfill({ json: [{ id: 9872, name: "選手 01", role: "Player", status: "pending" }] }),
  );
  await page.goto(`/competition/${competitionId}/admin/participants`);
  await expect(page.getByRole("grid").getByText("選手 01")).toBeVisible();
  await manualScreenshot(page, "admin/participant-approval");
});

test("管理員：資格賽排程", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const groupId = 9860;
  const groups = [
    { id: 9869, competition_id: competitionId, group_name: "未分組", group_index: 0, players: [] },
    { id: groupId, competition_id: competitionId, group_name: "公開男子反曲弓組", group_index: 1, players: [] },
  ];
  await adminCompetition(page, {
    ...progressCompetition,
    title: `${title}資格賽設定`,
    unassigned_group_id: 9869,
    groups_num: 1,
    unassigned_lane_id: 9868,
    groups,
  });
  await page.route(`**/api/groupinfo/players/${groupId}`, (route) => route.fulfill({ json: groups[1] }));
  await page.route(`**/api/qualification/lanes/players/${groupId}`, (route) => route.fulfill({
    json: { id: groupId, start_lane: 1, end_lane: 4, advancing_num: 4, lanes: [] },
  }));
  await page.route(`**/api/qualification/lanes/unassigned/${groupId}`, (route) => route.fulfill({
    json: [{ id: groupId, lanes: [{ id: 9868, lane_number: 0, players: [] }] }],
  }));
  await page.goto(`/competition/${competitionId}/admin/schedule/qualification`);
  await expect(page.getByRole("table", { name: "unassigned players table" }).first()).toBeVisible();
  await manualScreenshot(page, "admin/qualification-schedule");
});

test("管理員：資格賽排名", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const rankingCompetitionId = 9801;
  const rankingUserId = 9802;
  const groupId = 9810;
  const groups = [
    { id: 9809, competition_id: rankingCompetitionId, group_name: "未分組", group_range: "", bow_type: "", group_index: 0, players: [] },
    { id: groupId, competition_id: rankingCompetitionId, group_name: "公開男子反曲弓組", group_range: "公開男子", bow_type: "反曲弓", group_index: 1, players: [] },
    { id: 9811, competition_id: rankingCompetitionId, group_name: "公開女子反曲弓組", group_range: "公開女子", bow_type: "反曲弓", group_index: 2, players: [] },
  ];
  const data = {
    id: rankingCompetitionId,
    title,
    sub_title: "公開男子反曲弓組",
    host_id: rankingUserId,
    rounds_num: 6,
    unassigned_group_id: 9809,
    groups_num: 2,
    unassigned_lane_id: 9808,
    lanes_num: 0,
    current_phase: 0,
    qualification_current_end: 0,
    qualification_is_active: true,
    elimination_is_active: false,
    team_elimination_is_active: false,
    mixed_elimination_is_active: false,
    script: "",
    groups,
  };
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: rankingUserId } }));
  await page.route(`**/api/user/${rankingUserId}`, (route) => route.fulfill({ json: {
    id: rankingUserId, username: "ranking-admin", real_name: "管理員",
  } }));
  await page.route(`**/api/participant/competition/user/${rankingCompetitionId}/${rankingUserId}`, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(`**/api/competition/groups/${rankingCompetitionId}`, (route) => route.fulfill({ json: data }));
  await page.route(`**/api/competition/groups/players/${rankingCompetitionId}`, (route) =>
    route.fulfill({ json: { groups } }),
  );
  await page.route(`**/api/lane/all/${rankingCompetitionId}`, (route) => route.fulfill({ json: [] }));
  await page.route(`**/api/groupinfo/players/ranking/${groupId}`, (route) => route.fulfill({ json: {
    group_id: groupId,
    group_name: "公開男子反曲弓組",
    players: [
      { id: 1, name: "選手 01", rank: 1, total_score: 650, x_count: 12, ten_count: 20 },
      { id: 2, name: "選手 02", rank: 2, total_score: 650, x_count: 10, ten_count: 23 },
      { id: 3, name: "選手 03", rank: 3, total_score: 644, x_count: 8, ten_count: 19 },
    ],
  } }));
  await page.goto(`/competition/${rankingCompetitionId}/admin/progress/qualification`);
  await page.getByRole("button", { name: "手動調整排名" }).click();
  await expect(page.getByRole("heading", { name: "手動調整資格賽排名" })).toBeVisible();
  await manualScreenshot(page, "admin/qualification-ranking");
});
