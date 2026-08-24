import {
  DatabaseElimination,
  DatabaseGroup,
  DatabaseMatch,
  DatabaseMatchResult,
  DatabasePlayer,
  DatabaseStage,
} from "@/types/Api";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import useGetCompetitionProgress from "@/utils/QueryHooks/useGetCompetitionProgress";
import useGetCurrentParticipentDetail from "@/utils/QueryHooks/useGetCurrentParticipentDetail";
import useGetCompetitionGroupsWithPlayers from "@/utils/QueryHooks/useGetCompetitionGroupsWithPlayers";
import useGetEliminationIdByGroupId from "@/utils/QueryHooks/useGetEliminationIdByGroupId";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import useGetEliminationProgress from "@/utils/QueryHooks/useGetEliminationProgress";

// 對抗賽定位結果之判別式狀態；ready 才附完整資料。
export type EliminationMatchStatus =
  | { kind: "loading" }
  | { kind: "notLoggedIn" }
  | { kind: "noParticipant" }
  | { kind: "noPlayer" }
  | { kind: "phaseInactive" } // 該 phase 對應 *_is_active 為 false（含 current_phase 非 1/2/3 之非本 slot 情形）
  | { kind: "noElimination" } // 該組無對應 team_size 的 elimination
  | { kind: "noPlayerSet" } // 尚未建立含本 player 的 PlayerSet
  | { kind: "noMatch" } // 尚未安排 Match
  | { kind: "bye" } // 選手輪空（Match 僅一方 / 對手缺）
  | { kind: "stageOutOfRange" } // current_stage 越界
  | { kind: "endOutOfRange" } // current_end 越界
  | { kind: "error"; message: string; retry: () => void }
  | { kind: "ready"; data: EliminationMatchData };

export interface EliminationMatchData {
  competitionId: number;
  elimination: DatabaseElimination;
  teamSize: number;
  group: DatabaseGroup; // 由 group_id 比對得
  currentStage: DatabaseStage;
  currentEndIndex: number; // elimination.current_end
  match: DatabaseMatch; // 含本 player_set 之 Match
  matchResults: DatabaseMatchResult[]; // 該 Match 雙方
  myPlayerSetId: number;
  myMatchResultId: number;
  myPlayer: DatabasePlayer;
}

// phase(1 個人 / 2 團體 / 3 混雙) → teamSize(1/3/2) 對映。非 1/2/3 者回傳 undefined（非本 slot 職責）。
function mapPhaseToTeamSize(phase: number | undefined): number | undefined {
  switch (phase) {
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 2;
    default:
      return undefined;
  }
}

/**
 * 定位目前使用者於對抗賽中應記分之對局。
 * 依 §3 演算法，全程以 id／group_id／team_size 比對，禁用陣列索引（current_stage 除外——
 * DatabaseStage 未提供可辨識序欄位，僅能以陣列位置對應 current_stage，仍全數邊界檢查）。
 */
export default function useCurrentEliminationMatch(
  competitionId: number
): EliminationMatchStatus {
  const userQuery = useGetCurrentUserDetail();
  // current_phase 與啟用旗標會由管理員在記分期間切換，故必須輪詢輕量 competition。
  // groups 仍由既有詳情快取提供，避免反覆下載不會變動的關聯資料。
  const competitionProgressQuery = useGetCompetitionProgress(competitionId);
  const competitionQuery = useGetCompetitionWithGroups(competitionId);
  const participantQuery = useGetCurrentParticipentDetail(
    competitionId,
    userQuery.data?.id
  );
  const groupsWithPlayersQuery =
    useGetCompetitionGroupsWithPlayers(competitionId);

  const myPlayer = groupsWithPlayersQuery.data
    ?.flatMap((group) => group.players ?? [])
    .find((player) => player.participant_id === participantQuery.data?.id);

  const phase = competitionProgressQuery.data?.current_phase;
  const teamSize = mapPhaseToTeamSize(phase);

  const eliminationIdQuery = useGetEliminationIdByGroupId(
    competitionId,
    myPlayer?.group_id,
    teamSize
  );
  const eliminationDetailQuery = useGetEliminationDetail(
    eliminationIdQuery.data
  );
  // full detail 用於籤表與比分；此輕量查詢只決定目前 stage/end，絕不可用它覆寫 slice。
  const eliminationProgressQuery = useGetEliminationProgress(
    eliminationIdQuery.data
  );

  const retryAll = () => {
    userQuery.refetch();
    competitionProgressQuery.refetch();
    competitionQuery.refetch();
    participantQuery.refetch();
    groupsWithPlayersQuery.refetch();
    eliminationIdQuery.refetch();
    eliminationDetailQuery.refetch();
    eliminationProgressQuery.refetch();
  };

  // --- 依序檢查各階段的載入 / 失敗狀態 ---
  if (
    userQuery.isLoading ||
    competitionProgressQuery.isLoading ||
    competitionQuery.isLoading
  ) {
    return { kind: "loading" };
  }
  if (userQuery.isError) {
    return { kind: "error", message: "無法取得使用者資料", retry: retryAll };
  }
  if (!userQuery.data) {
    return { kind: "notLoggedIn" };
  }
  if (competitionProgressQuery.isError || competitionQuery.isError) {
    return { kind: "error", message: "無法取得賽事資料", retry: retryAll };
  }
  if (!competitionProgressQuery.data || !competitionQuery.data) {
    return { kind: "error", message: "找不到賽事資料", retry: retryAll };
  }

  if (teamSize === undefined) {
    // current_phase 非 1/2/3：非本 slot 職責，layout 理應不渲染 elimination slot；
    // 此處防禦性地視為「對抗賽階段未開放」。
    return { kind: "phaseInactive" };
  }

  const phaseIsActive =
    phase === 1
      ? competitionProgressQuery.data.elimination_is_active
      : phase === 2
        ? competitionProgressQuery.data.team_elimination_is_active
        : competitionProgressQuery.data.mixed_elimination_is_active;
  if (!phaseIsActive) {
    return { kind: "phaseInactive" };
  }

  if (participantQuery.isLoading) {
    return { kind: "loading" };
  }
  if (participantQuery.isError) {
    return { kind: "error", message: "無法取得參賽者資料", retry: retryAll };
  }
  if (!participantQuery.data) {
    return { kind: "noParticipant" };
  }

  if (groupsWithPlayersQuery.isLoading) {
    return { kind: "loading" };
  }
  if (groupsWithPlayersQuery.isError) {
    return { kind: "error", message: "無法取得選手資料", retry: retryAll };
  }
  if (!myPlayer) {
    return { kind: "noPlayer" };
  }
  if (myPlayer.id === undefined || myPlayer.group_id === undefined) {
    return { kind: "error", message: "選手資料缺少必要欄位", retry: retryAll };
  }

  if (eliminationIdQuery.isLoading) {
    return { kind: "loading" };
  }
  if (eliminationIdQuery.isError) {
    return { kind: "error", message: "無法取得對抗賽資料", retry: retryAll };
  }
  if (eliminationIdQuery.data === undefined) {
    return { kind: "noElimination" };
  }

  if (eliminationDetailQuery.isLoading) {
    return { kind: "loading" };
  }
  if (eliminationDetailQuery.isError) {
    return { kind: "error", message: "無法取得對抗賽詳細資料", retry: retryAll };
  }
  const elimination = eliminationDetailQuery.data;
  if (!elimination) {
    return { kind: "error", message: "找不到對抗賽資料", retry: retryAll };
  }

  if (eliminationProgressQuery.isLoading) {
    return { kind: "loading" };
  }
  if (eliminationProgressQuery.isError || !eliminationProgressQuery.data) {
    return {
      kind: "error",
      message: "無法取得對抗賽目前進度",
      retry: retryAll,
    };
  }

  const group = competitionQuery.data.groups?.find(
    (g) => g.id === myPlayer.group_id
  );
  if (!group) {
    return { kind: "error", message: "找不到組別資料", retry: retryAll };
  }

  const myPlayerSet = elimination.player_sets?.find((ps) =>
    ps.players?.some((p) => p.id === myPlayer.id)
  );
  if (myPlayerSet?.id === undefined) {
    return { kind: "noPlayerSet" };
  }
  const myPlayerSetId = myPlayerSet.id;

  // current_stage 越界檢查。DatabaseStage 未提供可辨識序欄位，僅能以陣列位置對應。
  const currentStageIndex = eliminationProgressQuery.data.current_stage;
  const stages = elimination.stages;
  if (
    currentStageIndex === undefined ||
    !stages ||
    currentStageIndex < 0 ||
    currentStageIndex >= stages.length
  ) {
    return { kind: "stageOutOfRange" };
  }
  const currentStage = stages[currentStageIndex];

  const match = currentStage.matchs?.find((m) =>
    m.match_results?.some((mr) => mr.player_set_id === myPlayerSetId)
  );
  if (!match) {
    return { kind: "noMatch" };
  }

  const matchResults = match.match_results ?? [];
  const myMatchResult = matchResults.find(
    (mr) => mr.player_set_id === myPlayerSetId
  );
  if (myMatchResult?.id === undefined) {
    return { kind: "noMatch" };
  }
  const myMatchResultId = myMatchResult.id;

  // 輪空判定：Match 僅一方，或對手 MatchResult 缺 player_set。
  const opponent = matchResults.find((mr) => mr.id !== myMatchResultId);
  if (
    matchResults.length < 2 ||
    !opponent ||
    opponent.player_set_id === undefined
  ) {
    return { kind: "bye" };
  }

  const currentEndIndex = eliminationProgressQuery.data.current_end;
  if (currentEndIndex === undefined) {
    return { kind: "endOutOfRange" };
  }
  const myEnds = myMatchResult.match_ends;
  const opponentEnds = opponent.match_ends;
  if (
    !myEnds ||
    currentEndIndex < 0 ||
    currentEndIndex >= myEnds.length ||
    !opponentEnds ||
    currentEndIndex >= opponentEnds.length
  ) {
    return { kind: "endOutOfRange" };
  }

  return {
    kind: "ready",
    data: {
      competitionId,
      elimination: {
        ...elimination,
        current_stage: currentStageIndex,
        current_end: currentEndIndex,
      },
      teamSize,
      group,
      currentStage,
      currentEndIndex,
      match,
      matchResults,
      myPlayerSetId,
      myMatchResultId,
      myPlayer,
    },
  };
}
