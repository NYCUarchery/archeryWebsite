import type { Page } from "@playwright/test";

type Competition = { id: number; title: string; qualification_current_end: number };
type Group = { group_name: string; group_index: number };

export const legacyTitles = {
  registered: "not-started",
  qualificationFinished: "qualification-in-progress",
} as const;

export async function legacyCompetition(page: Page, title: string): Promise<Competition> {
  const response = await page.request.get("/api/competition");
  if (!response.ok()) throw new Error(`讀取 legacy competitions 失敗：${response.status()}`);
  const competitions = await response.json() as Competition[];
  const matches = competitions.filter((candidate) => candidate.title === "男反選拔" &&
    (title === legacyTitles.registered ? candidate.qualification_current_end < 0 : candidate.qualification_current_end >= 0));
  if (matches.length !== 1) throw new Error(`legacy competition ${title} 應唯一，實有 ${matches.length}`);
  return matches[0];
}

export async function legacyGroupIndex(page: Page, competitionId: number, groupName: string) {
  const response = await page.request.get(`/api/competition/groups/${competitionId}`);
  if (!response.ok()) throw new Error(`讀取 legacy groups 失敗：${response.status()}`);
  const data = await response.json() as { groups?: Group[] };
  const group = data.groups?.find((candidate) => candidate.group_name === groupName);
  if (!group) throw new Error(`找不到 legacy group：${groupName}`);
  return group.group_index;
}

export async function gotoQualificationScoreboard(page: Page, title = legacyTitles.qualificationFinished) {
  const competition = await legacyCompetition(page, title);
  const groupIndex = await legacyGroupIndex(page, competition.id, "男反30公尺");
  await page.goto(`/competition/${competition.id}/scoreboard/${groupIndex}/qualification`);
  return { competition, groupIndex };
}

export async function applyToLegacyCompetition(page: Page, competitionId: number, role: "選手" | "裁判") {
  const response = await page.request.get("/api/competition/current/0/4");
  if (!response.ok()) throw new Error("近期賽事讀取失敗");
  const competitions = await response.json() as Competition[];
  const index = competitions.findIndex((competition) => competition.id === competitionId);
  if (index < 0) throw new Error("指定 legacy 賽事未出現在近期清單");
  // Legacy titles repeat. Match the visible list to its formal GET response,
  // never to a fixture ID or a guessed second card.
  await page.locator(".MuiCard-root").filter({ has: page.getByRole("button", { name: "查看記分板", exact: true }) })
    .filter({ hasNot: page.locator(".MuiCard-root") }).nth(index)
    .getByRole("button", { name: "申請加入", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: `申請為${role}` }).click();
}
