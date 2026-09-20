import { test, expect } from "./fixtures";
import { request as apiRequest } from "@playwright/test";
import {
  admin,
  applyToCompetition,
  approveAllApplicants,
  archers,
  createCompetition,
  createGroup,
  judge,
  selectGroup,
  signIn,
  signedInPage,
} from "./lifecycle/actors";
import { assignPlayersToGroup, assignQualificationLanes, saveQualificationSettings } from "./lifecycle/groups";
import { activateQualification, advanceQualification, scoreQualificationEndByMode, scorePlayerQualificationEnd, updateQualificationRanking } from "./lifecycle/qualification";
import { advanceStage, chooseJudgeIndividual, scoreJudgeEliminationMatch, setIndividualProgress, syncFirstRound } from "./lifecycle/elimination";
import { compoundQualificationOracle, recurveQualificationOracle, type QualificationOracle } from "./lifecycle/data";
import { assertCompletedIndividualBracket, assertIndividualProgressIsolation, resolveIndividualEliminationId, snapshotIndividualEvent } from "./lifecycle/verification";
import { completeTeamLifecycle } from "./lifecycle/teamLifecycle";
import { correctConfirmedEliminationEnd, correctConfirmedQualificationEnd } from "./lifecycle/judgeCorrections";
import { assertJudgeEventAvailability, assertDivergedEliminationScopes, assertQualificationRankingDialogScopes, assertQualificationScheduleScopes } from "./lifecycle/scopeNavigation";
import { assertArcher01ReadsConfirmedQualificationFirstEnd, assertPlayerReadsConfirmedCurrentMatch, assertPublicQualificationRanking } from "./lifecycle/crossRoleReadback";
import { assertLifecyclePersistsAfterRestart } from "./lifecycle/persistence";
import { parseLifecycleExecutionMode, qualificationWriteActor } from "./lifecycle/execution";
import { applyIndependentApiApplicant, approvePendingApiApplicant } from "./lifecycle/hybridActors";
import { collectLifecycleResultSnapshot } from "./lifecycle/resultSnapshotCollector";
import { normalizeLifecycleSnapshot } from "./lifecycle/resultSnapshot";
import { resolveCurrentQualificationEnd } from "./lifecycle/formalApi";

test.use({
  databaseFixture: "accounts",
  // The 24 applicants plus scoring contexts otherwise produce hundreds of
  // megabytes of filmstrip frames. Keep DOM/network/actions/source tracing
  // and the config's separate only-on-failure PNG screenshots.
  trace: { mode: "retain-on-failure", screenshots: false, snapshots: true, sources: true },
});
test.setTimeout(20 * 60_000);

const title = "E2E 兩組別個人與團體賽生命週期";
const recurve = "E2E 反曲弓";
const compound = "E2E 複合弓";


function endScores(oracle: QualificationOracle, end: number): ("10" | "9")[] {
  const arrows = oracle.arrows.slice(end * 6, end * 6 + 6);
  if (arrows.length !== 6 || !/^[X9]+$/.test(arrows)) throw new Error(`invalid literal qualification oracle for end ${end + 1}`);
  return [...arrows].map((arrow) => arrow === "X" ? "10" : "9");
}

function playerName(index: number) {
  return `E2E Archer ${String(index).padStart(2, "0")}`;
}

function escapedText(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("完成兩組資格賽、個人及團體頒牌與跨角色隔離", async ({ browser, page, request, restartBackend }, testInfo) => {
  const mode = parseLifecycleExecutionMode();
  const coverage = { mode, enrollment: { expected: 25, uiApplied: 0, apiApplied: 0, uiApproved: 0, apiApproved: 0 }, qualification: { ui: 0, api: 0, expected: 144 }, elimination: { uiSides: 0, apiSides: 0, expectedSides: 184 } };
  let competitionId: number;
  await page.goto("/");
  const baseURL = new URL(page.url()).origin;
  const judgeSession = await signedInPage(browser, baseURL, judge, { viewport: { width: 390, height: 844 } });
  const recurvePlayerSession = await signedInPage(browser, baseURL, archers[0]);
  const compoundPlayerSession = await signedInPage(browser, baseURL, archers[12]);
  const visitorContext = await browser.newContext({ baseURL });
  const visitorPage = await visitorContext.newPage();
  let ninthPlaceSession: Awaited<ReturnType<typeof signedInPage>> | undefined;

  try {
    await test.step("申請與核准", async () => {
      await signIn(page, admin);
      competitionId = await createCompetition(page, title);
      if (mode === "full-ui") {
        for (const account of archers) {
          const session = account === archers[0] ? recurvePlayerSession : account === archers[12] ? compoundPlayerSession : await signedInPage(browser, baseURL, account);
          await test.step(`申請 UI 選手 ${account}`, async () => {
            try { await applyToCompetition(session.page, title, "選手"); } finally { if (session !== recurvePlayerSession && session !== compoundPlayerSession) await session.context.close(); }
          });
          coverage.enrollment.uiApplied += 1;
        }
        await test.step(`申請 UI 裁判 ${judge}`, async () => { await applyToCompetition(judgeSession.page, title, "裁判"); });
        coverage.enrollment.uiApplied += 1;
        await test.step("核准 Admin UI 全部 25 位申請", async () => { await approveAllApplicants(page, competitionId, 25); });
        coverage.enrollment.uiApproved += 25;
      } else {
        await test.step(`申請 UI 選手 ${archers[0]}`, async () => { await applyToCompetition(recurvePlayerSession.page, title, "選手"); });
        await test.step(`申請 UI 選手 ${archers[12]}`, async () => { await applyToCompetition(compoundPlayerSession.page, title, "選手"); });
        await test.step(`申請 UI 裁判 ${judge}`, async () => { await applyToCompetition(judgeSession.page, title, "裁判"); });
        coverage.enrollment.uiApplied += 3;
        await test.step("核准 Admin UI 首批 3 位申請", async () => { await approveAllApplicants(page, competitionId, 3); });
        coverage.enrollment.uiApproved += 3;
        const adminActor = { role: "Admin" as const, username: admin, competitionId, groupName: recurve };
        for (const [index, account] of archers.entries()) {
          if (index === 0 || index === 12) continue;
          const applicant = await test.step(`申請 API 選手 ${account}`, async () =>
            await applyIndependentApiApplicant(mode, apiRequest, { baseURL, username: account, password: "archery-e2e-password", competitionId }));
          coverage.enrollment.apiApplied += 1;
          await test.step(`核准 Admin API 選手 ${account}`, async () =>
            await approvePendingApiApplicant(mode, page.request, adminActor, { participantId: applicant.participantId, applicantUserId: applicant.userId, expectedPlayerName: playerName(index + 1) }));
          coverage.enrollment.apiApproved += 1;
        }
        expect(coverage.enrollment).toMatchObject({ uiApplied: 3, apiApplied: 22, uiApproved: 3, apiApproved: 22 });
      }
    });

    await test.step("建立組別、靶位與資格賽", async () => {
      const [adminIdentity, judgeIdentity, participantsResponse] = await Promise.all([
        page.request.get("/api/user/me"),
        judgeSession.page.request.get("/api/user/me"),
        page.request.get(`/api/participant/competition/${competitionId}`),
      ]);
      expect(adminIdentity.ok()).toBeTruthy();
      expect(judgeIdentity.ok()).toBeTruthy();
      expect(participantsResponse.ok()).toBeTruthy();
      const adminId = (await adminIdentity.json() as { id: number }).id;
      const judgeId = (await judgeIdentity.json() as { id: number }).id;
      // This endpoint's ParticipantWName contract deliberately uses snake_case
      // (`user_id`), unlike the internal database Participant JSON type.
      const participants = await participantsResponse.json() as Array<{ id: number; user_id: number; role: string; status: string }>;
      expect(participants.find((participant) => participant.user_id === adminId)).toMatchObject({ role: "Admin", status: "approved" });
      const judgeParticipant = participants.find((participant) => participant.user_id === judgeId);
      expect(judgeParticipant).toMatchObject({ role: "Judge", status: "approved" });
      const approvedPlayers = participants.filter((participant) => participant.role === "Player" && participant.status === "approved");
      expect(approvedPlayers).toHaveLength(24);
      const rosterResponse = await page.request.get(`/api/competition/groups/players/${competitionId}`);
      expect(rosterResponse.ok()).toBeTruthy();
      const roster = await rosterResponse.json() as { groups: Array<{ players: Array<{ name: string; participant_id: number }> }> };
      expect(roster.groups.flatMap((group) => group.players).some((player) => player.participant_id === judgeParticipant!.id)).toBe(false);
      const playerParticipantIds = roster.groups.flatMap((group) => group.players).map((player) => player.participant_id);
      expect(new Set(playerParticipantIds).size).toBe(24);
      expect([...new Set(playerParticipantIds)].sort((left, right) => left - right)).toEqual(approvedPlayers.map((participant) => participant.id).sort((left, right) => left - right));
      await page.goto(`/competition/${competitionId}/admin/groups`);
      await createGroup(page, competitionId, recurve, "反曲弓");
      await createGroup(page, competitionId, compound, "複合弓");
      await assignPlayersToGroup(page, competitionId, archers.slice(0, 12).map((_, index) => playerName(index + 1)), recurve);
      await assignPlayersToGroup(page, competitionId, archers.slice(12).map((_, index) => playerName(index + 13)), compound);
      await saveQualificationSettings(page, competitionId, recurve, 8);
      await saveQualificationSettings(page, competitionId, compound, 8);
      await assignQualificationLanes(page, competitionId, recurve, archers.slice(0, 12).map((_, index) => playerName(index + 1)), 1);
      await assignQualificationLanes(page, competitionId, compound, archers.slice(12).map((_, index) => playerName(index + 13)), 7);
      await activateQualification(page, competitionId);
      await page.goto(`/competition/${competitionId}/admin/schedule/activation`);
      await page.getByRole("group", { name: "直接選擇選手畫面" }).getByRole("button", { name: "資格賽" }).click();
    });

    await test.step("資格賽 UI/API 分配寫入兩組六波，選手各自完成第一波", async () => {
      // The player-board interactions prove that an approved Player can score
      // its own group; Judge performs the remaining deterministic arrows.
      for (let groupOffset = 0; groupOffset <= 12; groupOffset += 12) {
        const playerPage = groupOffset === 0 ? recurvePlayerSession.page : compoundPlayerSession.page;
        await playerPage.goto(`/competition/${competitionId}/scoring`);
        await expect(playerPage.getByText("End 1")).toBeVisible();
        const playerIndex = groupOffset + 1;
        const playerScores = groupOffset === 0
          ? ["9", "10", "10", "10", "10", "10"]
          : endScores(compoundQualificationOracle[0], 0);
        const playerRef = await resolveCurrentQualificationEnd(playerPage.request, {
          role: "Player", username: groupOffset === 0 ? archers[0] : archers[12], competitionId,
          groupName: groupOffset === 0 ? recurve : compound,
        }, playerName(playerIndex));
        await test.step(`資格賽 Player UI ${groupOffset === 0 ? recurve : compound} ${playerName(playerIndex)} 第 1 波`, async () => {
          await scorePlayerQualificationEnd(playerPage, playerScores, playerRef);
        });
        coverage.qualification.ui += 1;
      }
      for (let end = 0; end < 6; end += 1) {
        for (let index = 0; index < 24; index += 1) {
          if (end === 0 && (index === 0 || index === 12)) continue;
          const oracle = index < 12 ? recurveQualificationOracle[index] : compoundQualificationOracle[index - 12];
          await test.step(`資格賽 ${mode === "full-ui" || qualificationWriteActor(index + 1, end) === "judge-ui" ? "Judge UI" : "Judge API"} ${index < 12 ? recurve : compound} ${playerName(index + 1)} 第 ${end + 1} 波`, async () => {
            const strategy = qualificationWriteActor(index + 1, end);
            if (mode === "full-ui" || strategy === "judge-ui") await judgeSession.page.goto(`/competition/${competitionId}/judge`);
            await scoreQualificationEndByMode({
              mode,
              judgePage: judgeSession.page,
              judgeActor: { role: "Judge", username: judge, competitionId },
              playerName: playerName(index + 1), archerIndex: index + 1,
              groupName: index < 12 ? recurve : compound, endIndex: end, scores: endScores(oracle, end),
              recordUi: () => { coverage.qualification.ui += 1; },
              recordApi: () => { coverage.qualification.api += 1; },
            });
          });
        }
        if (end === 0) {
          await correctConfirmedQualificationEnd(judgeSession.page, {
            competitionId,
            playerName: playerName(1),
            endIndex: 0,
            provisional: ["9", "10", "10", "10", "10", "10"],
            expected: ["10", "10", "10", "10", "10", "10"],
            discardOnCancel: true,
          });
          await assertArcher01ReadsConfirmedQualificationFirstEnd(recurvePlayerSession.page, competitionId);
        }
        await advanceQualification(page, competitionId);
      }
      await updateQualificationRanking(page, competitionId);
    });

    await test.step("排名第 8 與第 9 的邊界，及兩組公開選單資料隔離", async () => {
      const groupsResponse = await request.get(`/api/competition/groups/players/${competitionId}`);
      expect(groupsResponse.ok()).toBeTruthy();
      const groups = await groupsResponse.json() as { groups: Array<{ group_name: string; group_index: number; players: Array<{ id: number; name: string; rank: number; total_score: number }> }> };
      for (const [name, firstPlayer, oracle] of [[recurve, 1, recurveQualificationOracle], [compound, 13, compoundQualificationOracle]] as const) {
        const group = groups.groups.find((candidate) => candidate.group_name === name);
        expect(group, `${name} must exist`).toBeTruthy();
        expect(group!.players).toHaveLength(12);
        for (const [index, expected] of oracle.entries()) {
          const rank = index + 1;
          expect(group!.players.find((player) => player.rank === rank)).toMatchObject({ name: playerName(firstPlayer + index), rank, total_score: expected.total });
        }
      }
      const recurveIndex = groups.groups.find((group) => group.group_name === recurve)!;
      const compoundIndex = groups.groups.find((group) => group.group_name === compound)!;
      // Public routes use persisted group_index (0/1), whereas admin menus
      // include the hidden unassigned entry and therefore use 1/2 locally.
      expect(recurveIndex.group_index).toBe(0);
      expect(compoundIndex.group_index).toBe(1);
      await assertQualificationScheduleScopes(page, competitionId,
        { name: recurve, leaderName: playerName(1), startLane: 1, endLane: 6 },
        { name: compound, leaderName: playerName(13), startLane: 7, endLane: 12 },
      );
      await assertQualificationRankingDialogScopes(page, competitionId,
        { name: recurve, leaderName: playerName(1), startLane: 1, endLane: 6 },
        { name: compound, leaderName: playerName(13), startLane: 7, endLane: 12 },
      );
      await assertPublicQualificationRanking(visitorPage, {
        competitionId, groupIndex: recurveIndex.group_index,
        rows: recurveQualificationOracle.map((entry, index) => ({ rank: index + 1, name: playerName(index + 1), total: entry.total })),
      });
      await assertPublicQualificationRanking(visitorPage, {
        competitionId, groupIndex: compoundIndex.group_index,
        rows: compoundQualificationOracle.map((entry, index) => ({ rank: index + 1, name: playerName(index + 13), total: entry.total })),
      });
      await visitorPage.goto(`/competition/${competitionId}/scoreboard/${recurveIndex.group_index}/qualification`);
      await visitorPage.getByRole("button", { name: recurve, exact: true }).click();
      await visitorPage.getByRole("listitem").filter({ hasText: new RegExp(`^${escapedText(compound)}$`) }).click();
      await expect(visitorPage.getByText("E2E Archer 13", { exact: true })).toBeVisible();
      await expect(visitorPage.getByText("E2E Archer 01", { exact: true })).toHaveCount(0);
      await visitorPage.getByRole("button", { name: compound, exact: true }).click();
      await visitorPage.getByRole("listitem").filter({ hasText: new RegExp(`^${escapedText(recurve)}$`) }).click();
      await expect(visitorPage.getByText("E2E Archer 01", { exact: true })).toBeVisible();
    });

    await test.step("兩組皆由 UI 建立前八名個人隊伍與完整八強對抗樹", async () => {
      for (const groupName of [recurve, compound]) {
        await page.goto(`/competition/${competitionId}/admin/schedule/elimination/1`);
        await selectGroup(page, groupName, competitionId);
        await page.getByRole("button", { name: "依資格排名建立隊伍" }).click();
        const autoCreateDialog = page.getByRole("dialog", { name: "依資格排名建立隊伍" });
        await expect(autoCreateDialog).toBeVisible();
        const autoCreated = page.waitForResponse((candidate) => candidate.request().method() === "POST" &&
          /^\/api\/playerset\/elimination\/\d+\/auto\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
        await autoCreateDialog.getByRole("button", { name: "確認建立", exact: true }).click();
        await autoCreated;
        await expect(autoCreateDialog).toBeHidden();
        const autoRanked = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
          /^\/api\/playerset\/elimination\/\d+\/ranking\/auto\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
        await page.getByRole("button", { name: "自動更新排名", exact: true }).click();
        await autoRanked;
        await page.getByRole("button", { name: "建立完整對抗樹" }).click();
        const dialog = page.getByRole("dialog", { name: "建立完整對抗樹" });
        await expect(dialog).toBeVisible();
        await dialog.getByLabel("晉級數").fill("8");
        const bracketCreated = page.waitForResponse((candidate) => candidate.request().method() === "POST" &&
          /^\/api\/elimination\/bracket\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
        await dialog.getByRole("button", { name: "建立" }).click();
        await bracketCreated;
        await expect(dialog).toBeHidden();
        await expect(page.getByText("實際隊數：8")).toBeVisible();
        const eliminations = await request.get(`/api/competition/groups/eliminations/${competitionId}`);
        expect(eliminations.ok()).toBeTruthy();
        const eliminationData = await eliminations.json() as { group_data: Array<{ group_name: string; elimination_data: Array<{ elimination_id: number; team_size: number }> }> };
        const eliminationId = eliminationData.group_data.find((group) => group.group_name === groupName)?.elimination_data.find((item) => item.team_size === 1)?.elimination_id;
        expect(eliminationId).toBeTruthy();
        const setsResponse = await request.get(`/api/playerset/elimination/${eliminationId}`);
        expect(setsResponse.ok()).toBeTruthy();
        // ApiRouter routes this URL to GetAllPlayerSetsByEliminationId, whose
        // handler serialises []database.PlayerSet directly (not a wrapper).
        const sets = await setsResponse.json() as Array<{ rank: number; set_name: string }>;
        const groupsResponse = await request.get(`/api/competition/groups/players/${competitionId}`);
        const groupsData = await groupsResponse.json() as { groups: Array<{ group_name: string; players: Array<{ name: string; rank: number }> }> };
        const ranked = [...groupsData.groups.find((group) => group.group_name === groupName)!.players].sort((left, right) => left.rank - right.rank);
        expect(sets).toHaveLength(8);
        expect(sets.map((set) => set.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(sets.map((set) => set.set_name)).toEqual(ranked.slice(0, 8).map((player) => player.name));
        for (const player of ranked.slice(8)) expect(sets.map((set) => set.set_name)).not.toContain(player.name);
      }
    });

    await test.step("兩組個人賽 UI/API 分配至金銅戰，管理端依結果晉級及頒牌", async () => {
      await page.goto(`/competition/${competitionId}/admin/schedule/activation`);
      const activated = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
        new URL(candidate.url()).pathname === `/api/competition/elimination-isactive/${competitionId}` && candidate.status() === 200);
      await page.getByRole("group", { name: "開啟賽程" }).getByRole("button", { name: "對抗賽", exact: true }).click();
      await activated;
      const phaseUpdated = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
        new URL(candidate.url()).pathname === `/api/competition/current-phase/${competitionId}` && candidate.status() === 200);
      await page.getByRole("group", { name: "直接選擇選手畫面" }).getByRole("button", { name: "對抗賽", exact: true }).click();
      await phaseUpdated;
      await assertJudgeEventAvailability(judgeSession.page, competitionId, recurve, "個人對抗賽", "團體對抗賽");
      ninthPlaceSession = await signedInPage(browser, baseURL, archers[8]);
      await ninthPlaceSession.page.goto(`/competition/${competitionId}/scoring`);
      await expect(ninthPlaceSession.page.getByText("您尚未被編入對抗賽的隊伍。", { exact: true })).toBeVisible();
      const rosterResponse = await request.get(`/api/competition/groups/players/${competitionId}`);
      expect(rosterResponse.ok()).toBeTruthy();
      const roster = await rosterResponse.json() as { groups: Array<{ group_name: string; players: Array<{ rank: number; participant_id: number }> }> };
      const participantIdsByGroup = new Map<string, readonly number[]>();
      for (const groupName of [recurve, compound]) {
        const ranked = [...(roster.groups.find((group) => group.group_name === groupName)?.players ?? [])].sort((left, right) => left.rank - right.rank);
        expect(ranked).toHaveLength(12);
        participantIdsByGroup.set(groupName, ranked.slice(0, 8).map((player) => player.participant_id));
      }
      // B remains this exact event snapshot while A advances through its whole
      // item. The later helper compares stage, end and medal resources.
      const recurveBefore = await snapshotIndividualEvent(request, competitionId, recurve);
      const compoundBefore = await snapshotIndividualEvent(request, competitionId, compound);
      // Literal bracket winner oracle: four quarterfinals, two semifinals,
      // then gold and bronze. It intentionally exercises both score sides.
      const rounds = [[1, 2, 1, 2], [1, 2], [1, 2]] as const;
      for (const groupName of [recurve, compound]) await syncFirstRound(page, competitionId, groupName);
      for (const [groupName, bow] of [[recurve, "recurve"], [compound, "compound"]] as const) {
        for (const [roundIndex, winners] of rounds.entries()) {
          const stage = roundIndex === 0 ? "1/4" : roundIndex === 1 ? "準決賽" : "決賽";
          await setIndividualProgress(page, competitionId, groupName, stage);
          await judgeSession.page.goto(`/competition/${competitionId}/judge`);
          await chooseJudgeIndividual(judgeSession.page, groupName);
          for (const [matchIndex, winningSide] of winners.entries()) {
            await test.step(`${groupName} ${stage} Match ${matchIndex + 1}`, async () => {
              await scoreJudgeEliminationMatch(judgeSession.page, matchIndex + 1, winningSide, bow, {
                adminPage: page,
                competitionId,
                groupName,
                teamSize: 1,
                stage,
                mode,
                apiActor: { role: "Judge", username: judge, competitionId },
                recordUiSide: () => { coverage.elimination.uiSides += 1; },
                recordApiSide: () => { coverage.elimination.apiSides += 1; },
                lastWaveWinnerScores: groupName === recurve && roundIndex === 0 && matchIndex === 0
                  ? ["10", "10", "9"] : undefined,
              });
              if (groupName === recurve && roundIndex === 0 && matchIndex === 0) {
                const eliminationId = await resolveIndividualEliminationId(request, competitionId, recurve);
                await correctConfirmedEliminationEnd(judgeSession.page, {
                  eliminationId, wave: 3, side: winningSide,
                  provisional: ["10", "10", "9"], expected: ["10", "10", "10"],
                  expectedPoints: 2, expectedCumulativePoints: 6, switchGroupAfterCancel: compound,
                });
                await assertPlayerReadsConfirmedCurrentMatch(recurvePlayerSession.page, {
                  competitionId, eliminationId, winnerTeam: playerName(1), loserTeam: playerName(8), teamSize: 1,
                });
              }
            });
          }
          await page.goto(`/competition/${competitionId}/admin/progress/elimination/1`);
          await selectGroup(page, groupName, competitionId);
          await advanceStage(page, roundIndex === 2 ? "依結果結算獎牌" : "依結果填入下一階段", roundIndex);
        }
        const eliminationId = await resolveIndividualEliminationId(request, competitionId, groupName);
        await assertCompletedIndividualBracket(request, eliminationId, participantIdsByGroup.get(groupName)!);
        if (groupName === recurve) {
          const recurveAfter = await snapshotIndividualEvent(request, competitionId, recurve);
          const compoundAfter = await snapshotIndividualEvent(request, competitionId, compound);
          assertIndividualProgressIsolation(recurveBefore, recurveAfter, compoundBefore, compoundAfter);
          await assertDivergedEliminationScopes(page, judgeSession.page, competitionId, 1,
            { groupName: recurve, stage: 2, end: 2, stageLabel: "決賽", setName: playerName(1) },
            { groupName: compound, stage: 0, end: 0, stageLabel: "1/4", setName: playerName(13) },
          );
        }
      }
    });
    await test.step("同場兩組團體建隊至頒牌，未晉級者參團及賽制隔離", async () => {
      await completeTeamLifecycle({
        browser,
        baseURL,
        adminPage: page,
        judgePage: judgeSession.page,
        visitorPage,
        competitionId,
        groupNames: [
          { name: recurve, bow: "recurve", firstLane: 1 },
          { name: compound, bow: "compound", firstLane: 7 },
        ],
        mode,
        recordUiSide: () => { coverage.elimination.uiSides += 1; },
        recordApiSide: () => { coverage.elimination.apiSides += 1; },
      });
    });
    await test.step("重啟後以新登入完整讀回資格排名、四項賽果及獎牌", async () => {
      const expected = mode === "hybrid"
        ? { qualification: { ui: 14, api: 130 }, elimination: { uiSides: 42, apiSides: 142 } }
        : { qualification: { ui: 144, api: 0 }, elimination: { uiSides: 184, apiSides: 0 } };
      expect(coverage.enrollment).toMatchObject(mode === "hybrid"
        ? { expected: 25, uiApplied: 3, apiApplied: 22, uiApproved: 3, apiApproved: 22 }
        : { expected: 25, uiApplied: 25, apiApplied: 0, uiApproved: 25, apiApproved: 0 });
      expect(coverage.qualification).toMatchObject(expected.qualification);
      expect(coverage.elimination).toMatchObject(expected.elimination);
      const snapshot = normalizeLifecycleSnapshot(await collectLifecycleResultSnapshot(page.request, competitionId));
      await testInfo.attach("lifecycle-result-snapshot", { body: JSON.stringify(snapshot), contentType: "application/json" });
      await assertLifecyclePersistsAfterRestart({ browser, baseURL, competitionId, restartBackend });
    });
  } finally {
    await testInfo.attach("lifecycle-coverage-ledger", { body: JSON.stringify(coverage), contentType: "application/json" });
    await Promise.all([
      judgeSession.context.close(),
      recurvePlayerSession.context.close(),
      compoundPlayerSession.context.close(),
      visitorContext.close(),
      ninthPlaceSession?.context.close(),
    ]);
  }
});
