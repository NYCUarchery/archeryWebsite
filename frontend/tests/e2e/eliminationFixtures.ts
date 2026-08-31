// 對抗賽記分 e2e 測試共用之假資料建構與 API 攔截（mock）工具。
// 與 recordingBoard.spec.ts（資格賽）不同：對抗賽尚無可用之種子資料庫資料，
// 故改以 Playwright page.route 完整攔截前端會呼叫到的後端 API，
// 依契約（CONTRACT.md §0、§7）之實際型別組出假資料，讓測試不依賴真正的後端／資料庫。
import type { Page } from "@playwright/test";
// 僅取型別（無執行期依賴）：Api.ts 內含 enum，避免以一般 import 觸發整檔載入。
import type {
  DatabaseCompetition,
  DatabaseElimination,
  DatabaseGroup,
  DatabaseMatch,
  DatabaseMatchEnd,
  DatabaseMatchResult,
  DatabaseMatchScore,
  DatabaseParticipant,
  DatabasePlayer,
  DatabasePlayerSet,
  DatabaseStage,
  DatabaseUser,
  EndpointCompetitionWGroupsQuaEliData,
  EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData,
  EndpointPutMatchEndsScoresByIdMatchEndScoresData,
} from "@/types/Api";

// 三種對抗賽情境：個人（teamSize 1）、混雙（teamSize 2）、團體（teamSize 3）。
// phase 對映依 useCurrentEliminationMatch 之 mapPhaseToTeamSize：1→個人、2→團體、3→混雙。
export type EliminationVariant = "individual" | "mixed" | "team";
export type FixtureTarget = "A" | "B";

interface VariantConfig {
  phase: number;
  teamSize: number;
  capacity: number; // 該局箭數上限（每方每局）
  teamSizeLabel: string; // 隊伍規模對應之類型名稱（記分板已不顯示，僅供 fixture 自我描述）
}

const VARIANT_CONFIG: Record<EliminationVariant, VariantConfig> = {
  individual: { phase: 1, teamSize: 1, capacity: 3, teamSizeLabel: "個人賽" },
  mixed: { phase: 3, teamSize: 2, capacity: 4, teamSizeLabel: "混雙賽" },
  team: { phase: 2, teamSize: 3, capacity: 6, teamSizeLabel: "團體賽" },
};

// 固定 id 常數（每筆測試皆使用獨立 Playwright page/context，彼此不互相干擾，無須避免重複）。
const COMPETITION_ID = 9100;
const USER_ID = 9200;
const PARTICIPANT_ID = 9201;
const GROUP_ID = 9300;
const ELIMINATION_ID = 9400;
const STAGE_ID = 9401;
const MATCH_ID = 9402;
const MY_PLAYER_SET_ID = 9500;
const MY_MATCH_RESULT_ID = 9501;
const MY_MATCH_END_ID = 9502;
const MY_PLAYER_ID_BASE = 9510;
const MY_MATCH_SCORE_ID_BASE = 9520;
const OPPONENT_PLAYER_SET_ID = 9600;
const OPPONENT_MATCH_RESULT_ID = 9601;
const OPPONENT_MATCH_END_ID = 9602;
const OPPONENT_PLAYER_ID_BASE = 9610;
const OPPONENT_MATCH_SCORE_ID_BASE = 9620;
const OPPONENT_PARTICIPANT_ID_BASE = 9700; // 對手非本人參賽者 id（僅需與 PARTICIPANT_ID 不同）

// 建出一方之選手陣列。count === 1 時為個人；>1 時為混雙／團體全員。
function buildPlayers(
  idBase: number,
  count: number,
  namePrefix: string,
  participantIdForFirst?: number
): DatabasePlayer[] {
  const players: DatabasePlayer[] = [];
  for (let i = 0; i < count; i++) {
    players.push({
      id: idBase + i,
      group_id: GROUP_ID,
      name: count > 1 ? `${namePrefix}${i + 1}` : namePrefix,
      order: i + 1,
      participant_id:
        i === 0 && participantIdForFirst !== undefined
          ? participantIdForFirst
          : OPPONENT_PARTICIPANT_ID_BASE + idBase + i,
    });
  }
  return players;
}

// 建出一局（MatchEnd）容量為 capacity 之未填分數格（score 一律 -1）。
function buildMatchScores(idBase: number, capacity: number): DatabaseMatchScore[] {
  const scores: DatabaseMatchScore[] = [];
  for (let i = 0; i < capacity; i++) {
    scores.push({ id: idBase + i, score: -1 });
  }
  return scores;
}

export interface EliminationFixture {
  variant: EliminationVariant;
  competitionId: number;
  userId: number;
  eliminationId: number;
  matchId: number;
  capacity: number;
  teamSizeLabel: string;
  setNameMine: string;
  setNameOpponent: string;
  myMatchResultId: number;
  myMatchEndId: number;
  myMatchScoreIds: number[];
  opponentMatchResultId: number;
  opponentMatchEndId: number;
  opponentMatchScoreIds: number[];

  // 各 API 之回應內容（供 registerEliminationRoutes 使用）。
  user: DatabaseUser;
  competition: DatabaseCompetition;
  participants: DatabaseParticipant[];
  groupsWithPlayers: { groups: Array<DatabaseGroup & { players: DatabasePlayer[] }> };
  eliminationsByGroup: EndpointCompetitionWGroupsQuaEliData;
  elimination: DatabaseElimination; // 對抗賽全樹之初始「伺服器端」狀態
}

// 建構指定情境（個人／混雙／團體）之對抗賽假資料。
// options.noMatch === true 時，目前階段不安排任何 Match，模擬「找不到對局」情境。
export function buildEliminationFixture(
  variant: EliminationVariant,
  options?: { noMatch?: boolean; targets?: [FixtureTarget, FixtureTarget] }
): EliminationFixture {
  const config = VARIANT_CONFIG[variant];
  const setNameMine = "我方";
  const setNameOpponent = "對手";

  const myPlayers = buildPlayers(
    MY_PLAYER_ID_BASE,
    config.teamSize,
    "我方選手",
    PARTICIPANT_ID
  );
  const opponentPlayers = buildPlayers(
    OPPONENT_PLAYER_ID_BASE,
    config.teamSize,
    "對手選手"
  );

  const myPlayerSet: DatabasePlayerSet = {
    id: MY_PLAYER_SET_ID,
    elimination_id: ELIMINATION_ID,
    set_name: setNameMine,
    players: myPlayers,
    total_score: 0,
  };
  const opponentPlayerSet: DatabasePlayerSet = {
    id: OPPONENT_PLAYER_SET_ID,
    elimination_id: ELIMINATION_ID,
    set_name: setNameOpponent,
    players: opponentPlayers,
    total_score: 0,
  };

  const myMatchScoreIds = Array.from(
    { length: config.capacity },
    (_, i) => MY_MATCH_SCORE_ID_BASE + i
  );
  const opponentMatchScoreIds = Array.from(
    { length: config.capacity },
    (_, i) => OPPONENT_MATCH_SCORE_ID_BASE + i
  );

  const myMatchEnd: DatabaseMatchEnd = {
    id: MY_MATCH_END_ID,
    is_confirmed: false,
    match_result_id: MY_MATCH_RESULT_ID,
    match_scores: buildMatchScores(MY_MATCH_SCORE_ID_BASE, config.capacity),
    total_scores: 0,
  };
  const opponentMatchEnd: DatabaseMatchEnd = {
    id: OPPONENT_MATCH_END_ID,
    is_confirmed: false,
    match_result_id: OPPONENT_MATCH_RESULT_ID,
    match_scores: buildMatchScores(OPPONENT_MATCH_SCORE_ID_BASE, config.capacity),
    total_scores: 0,
  };

  // 真實端點 /elimination/stages/scores/medals/{id} 不 preload match_results[].player_set，
  // 故 fixture 亦只給 player_set_id，隊名／成員由 elimination.player_sets 反查。
  const myMatchResult: DatabaseMatchResult = {
    id: MY_MATCH_RESULT_ID,
    is_winner: false,
    lane_number: 3,
    match_id: MATCH_ID,
    player_set_id: MY_PLAYER_SET_ID,
    shoot_off_score: -1,
    total_points: 0,
    match_ends: [myMatchEnd],
  };
  const opponentMatchResult: DatabaseMatchResult = {
    id: OPPONENT_MATCH_RESULT_ID,
    is_winner: false,
    lane_number: 5,
    match_id: MATCH_ID,
    player_set_id: OPPONENT_PLAYER_SET_ID,
    shoot_off_score: -1,
    total_points: 0,
    match_ends: [opponentMatchEnd],
  };
  // Swagger 型別同步 target 前，以交集型別保留配置端點的新欄位測試資料。
  if (options?.targets) {
    opponentMatchResult.lane_number = myMatchResult.lane_number;
    (myMatchResult as DatabaseMatchResult & { target?: FixtureTarget }).target =
      options.targets[0];
    (
      opponentMatchResult as DatabaseMatchResult & { target?: FixtureTarget }
    ).target = options.targets[1];
  }

  const match: DatabaseMatch = {
    id: MATCH_ID,
    stage_id: STAGE_ID,
    match_results: [myMatchResult, opponentMatchResult],
  };

  const stage: DatabaseStage = {
    id: STAGE_ID,
    elimination_id: ELIMINATION_ID,
    matchs: options?.noMatch ? [] : [match],
  };

  const elimination: DatabaseElimination = {
    id: ELIMINATION_ID,
    group_id: GROUP_ID,
    current_end: 0,
    current_stage: 0,
    team_size: config.teamSize,
    player_sets: [myPlayerSet, opponentPlayerSet],
    stages: [stage],
    medals: [],
  };

  const competition: DatabaseCompetition = {
    id: COMPETITION_ID,
    current_phase: config.phase,
    title: "對抗賽記分測試賽事",
    groups: [
      {
        id: GROUP_ID,
        competition_id: COMPETITION_ID,
        group_name: "測試組別",
      },
    ],
    elimination_is_active: config.phase === 1,
    team_elimination_is_active: config.phase === 2,
    mixed_elimination_is_active: config.phase === 3,
  };

  const participants: DatabaseParticipant[] = [
    {
      id: PARTICIPANT_ID,
      competitionID: COMPETITION_ID,
      userID: USER_ID,
      role: "Player",
      status: "Accepted",
    },
  ];

  const groupsWithPlayers = {
    groups: [
      {
        id: GROUP_ID,
        competition_id: COMPETITION_ID,
        group_name: "測試組別",
        players: [...myPlayers, ...opponentPlayers],
      },
    ],
  };

  const eliminationsByGroup: EndpointCompetitionWGroupsQuaEliData = {
    competition_id: COMPETITION_ID,
    group_data: [
      {
        group_id: GROUP_ID,
        group_name: "測試組別",
        elimination_data: [{ elimination_id: ELIMINATION_ID, team_size: config.teamSize }],
      },
    ],
  };

  const user: DatabaseUser = {
    id: USER_ID,
    user_name: "elimination_tester",
    real_name: "對抗賽測試員",
    role: "Player",
  };

  return {
    variant,
    competitionId: COMPETITION_ID,
    userId: USER_ID,
    eliminationId: ELIMINATION_ID,
    matchId: MATCH_ID,
    capacity: config.capacity,
    teamSizeLabel: config.teamSizeLabel,
    setNameMine,
    setNameOpponent,
    myMatchResultId: MY_MATCH_RESULT_ID,
    myMatchEndId: MY_MATCH_END_ID,
    myMatchScoreIds,
    opponentMatchResultId: OPPONENT_MATCH_RESULT_ID,
    opponentMatchEndId: OPPONENT_MATCH_END_ID,
    opponentMatchScoreIds,
    user,
    competition,
    participants,
    groupsWithPlayers,
    eliminationsByGroup,
    elimination,
  };
}

export interface RecordedRequest {
  url: string;
  method: string;
  body: unknown;
}

export interface EliminationRouteHandles {
  savedScoreRequests: RecordedRequest[];
  confirmRequests: RecordedRequest[];
  // 積點／勝負／推進局數等「本功能不應呼叫」之其他對抗賽端點，若被呼叫會記錄於此。
  forbiddenRequests: RecordedRequest[];
  setScoresShouldFail(shouldFail: boolean): void;
  setConfirmShouldFail(shouldFail: boolean): void;
  setCompetitionPhase(phase: number): void;
  // 取得目前「伺服器端」某 MatchEnd 之狀態（PATCH 後會更新），供測試斷言持久化結果。
  getMatchEndState(matchEndId: number): DatabaseMatchEnd | undefined;
}

function findMatchEndById(
  elimination: DatabaseElimination,
  matchEndId: number
): DatabaseMatchEnd | undefined {
  for (const stage of elimination.stages ?? []) {
    for (const m of stage.matchs ?? []) {
      for (const mr of m.match_results ?? []) {
        const found = (mr.match_ends ?? []).find((me) => me.id === matchEndId);
        if (found) return found;
      }
    }
  }
  return undefined;
}

// 對抗賽記分不應觸碰之其他端點（積點／勝負／靶位／加時賽分數／單箭分數／推進局數與階段）。
const FORBIDDEN_PATTERNS = [
  "**/matchresult/iswinner/*",
  "**/matchresult/lanenumber/*",
  "**/matchresult/shootoffscore/*",
  "**/matchresult/totalpoints/*",
  "**/matchresult/matchend/totalscore/*",
  "**/matchresult/matchscore/score/*",
  "**/elimination/currentend/plus/*",
  "**/elimination/currentend/minus/*",
  "**/elimination/currentstage/plus/*",
  "**/elimination/currentstage/minus/*",
];

// 於指定 page 上攔截對抗賽記分頁會用到之所有後端 API，回傳可觀察／可控制之 handles。
export async function registerEliminationRoutes(
  page: Page,
  fixture: EliminationFixture
): Promise<EliminationRouteHandles> {
  // 深拷貝作為可變的「伺服器端」狀態，PATCH 會更新它，之後的 GET／reload 會讀到最新值。
  const serverElimination: DatabaseElimination = JSON.parse(
    JSON.stringify(fixture.elimination)
  );
  const serverCompetition: DatabaseCompetition = JSON.parse(
    JSON.stringify(fixture.competition)
  );

  const savedScoreRequests: RecordedRequest[] = [];
  const confirmRequests: RecordedRequest[] = [];
  const forbiddenRequests: RecordedRequest[] = [];
  let scoresShouldFail = false;
  let confirmShouldFail = false;

  await page.route("**/user/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: fixture.userId }),
    });
  });

  await page.route(`**/user/${fixture.userId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fixture.user),
    });
  });

  await page.route(`**/competition/groups/${fixture.competitionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(serverCompetition),
    });
  });

  // 記分頁每兩秒輪詢此輕量端點，以同步 current_phase 與資格賽波次。
  await page.route(`**/competition/${fixture.competitionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(serverCompetition),
    });
  });

  await page.route(
    `**/participant/competition/user/${fixture.competitionId}/${fixture.userId}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixture.participants),
      });
    }
  );

  await page.route(
    `**/competition/groups/players/${fixture.competitionId}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixture.groupsWithPlayers),
      });
    }
  );

  await page.route(
    `**/competition/groups/eliminations/${fixture.competitionId}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixture.eliminationsByGroup),
      });
    }
  );

  await page.route(
    `**/elimination/stages/scores/medals/${fixture.eliminationId}`,
    async (route) => {
      // 每次皆回傳目前「伺服器端」最新狀態，讓存分／確認後的 reload 能讀到最新結果。
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serverElimination),
      });
    }
  );

  await page.route(
    `**/elimination/playersets/${fixture.eliminationId}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serverElimination),
      });
    }
  );

  // current_stage/current_end 採輕量輪詢；完整籤表與分數仍由上方端點提供。
  await page.route(`**/elimination/${fixture.eliminationId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: serverElimination.id,
        group_id: serverElimination.group_id,
        team_size: serverElimination.team_size,
        current_stage: serverElimination.current_stage,
        current_end: serverElimination.current_end,
      }),
    });
  });

  await page.route("**/matchresult/matchend/scores/*", async (route) => {
    const request = route.request();
    const idMatch = request.url().match(/\/matchresult\/matchend\/scores\/(\d+)/);
    const matchEndId = idMatch ? Number(idMatch[1]) : -1;
    const body = request.postDataJSON() as EndpointPutMatchEndsScoresByIdMatchEndScoresData;
    savedScoreRequests.push({ url: request.url(), method: request.method(), body });

    if (scoresShouldFail) {
      await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      return;
    }

    const matchEnd = findMatchEndById(serverElimination, matchEndId);
    if (matchEnd && body.match_score_ids && body.scores) {
      body.match_score_ids.forEach((id, i) => {
        const target = matchEnd.match_scores?.find((s) => s.id === id);
        if (target) target.score = body.scores?.[i] ?? -1;
      });
      matchEnd.total_scores = body.total_scores;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.route("**/matchresult/matchend/isconfirmed/*", async (route) => {
    const request = route.request();
    const idMatch = request
      .url()
      .match(/\/matchresult\/matchend\/isconfirmed\/(\d+)/);
    const matchEndId = idMatch ? Number(idMatch[1]) : -1;
    const body =
      request.postDataJSON() as EndpointPutMatchEndsIsConfirmedByIdMatchEndIsConfirmedData;
    confirmRequests.push({ url: request.url(), method: request.method(), body });

    if (confirmShouldFail) {
      await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      return;
    }

    const matchEnd = findMatchEndById(serverElimination, matchEndId);
    if (matchEnd) matchEnd.is_confirmed = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  for (const pattern of FORBIDDEN_PATTERNS) {
    await page.route(pattern, async (route) => {
      const request = route.request();
      forbiddenRequests.push({
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON(),
      });
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  }

  return {
    savedScoreRequests,
    confirmRequests,
    forbiddenRequests,
    setScoresShouldFail: (shouldFail: boolean) => {
      scoresShouldFail = shouldFail;
    },
    setConfirmShouldFail: (shouldFail: boolean) => {
      confirmShouldFail = shouldFail;
    },
    setCompetitionPhase: (phase: number) => {
      serverCompetition.current_phase = phase;
    },
    getMatchEndState: (matchEndId: number) => findMatchEndById(serverElimination, matchEndId),
  };
}
