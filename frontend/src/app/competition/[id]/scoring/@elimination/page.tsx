"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { Snackbar, Alert } from "@mui/material";
import { apiClient } from "@/utils/ApiClient";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DatabaseMatchResult, DatabasePlayerSet } from "@/types/Api";
import useCurrentEliminationMatch from "./useCurrentEliminationMatch";
import {
  initializeMatchResults,
  selectMatchResult,
  addScore,
  deleteScore,
  markConfirmed,
  replaceSavedMatchEnd,
  setSaving,
  setSaveError,
  scorefmt,
  LocalMatchResult,
  LocalMatchScore,
} from "./eliminationScoringSlice";
import EliminationScoringStates from "./EliminationScoringStates";
import EliminationScoringBoard from "./EliminationScoringBoard";
import ClosedEliminationScoringBoard from "./ClosedEliminationScoringBoard";
import { recurveClosingEnd } from "./recurveClosingEnd";

type EliminationDetailResponse = Awaited<ReturnType<typeof apiClient.elimination.stagesScoresMedalsDetail>>;

// 把 useCurrentEliminationMatch 之 ready 資料（DatabaseMatchResult[] + 目前 MatchEnd）
// 轉換為 slice 所需的 LocalMatchResult[]（見契約 §3 末段之轉換規則）。
function toLocalMatchResults(
  matchResults: DatabaseMatchResult[],
  currentEndIndex: number,
  playerSets: DatabasePlayerSet[]
): LocalMatchResult[] {
  return matchResults.flatMap((matchResult) => {
    const matchEnd = matchResult.match_ends?.[currentEndIndex];
    if (
      matchResult.id === undefined ||
      matchResult.player_set_id === undefined ||
      matchEnd?.id === undefined
    ) {
      // 缺必要欄位者略過（防禦性；正常情境下 useCurrentEliminationMatch 已確保邊界）。
      return [];
    }

    // /elimination/stages/scores/medals/{id} 不 preload match_results[].player_set，
    // 故隊名與成員一律以 player_set_id 反查 elimination.player_sets（已含 Players）。
    const playerSet =
      playerSets.find((ps) => ps.id === matchResult.player_set_id) ??
      matchResult.player_set;

    const scores: LocalMatchScore[] = (matchEnd.match_scores ?? [])
      .filter((ms): ms is { id: number; score?: number } => ms.id !== undefined)
      .map((ms) => ({ id: ms.id, score: ms.score ?? -1 }))
      .sort((a, b) => b.score - a.score);

    const local: LocalMatchResult = {
      matchResultId: matchResult.id,
      playerSetId: matchResult.player_set_id,
      setName: playerSet?.set_name ?? "",
      memberNames: (playerSet?.players ?? []).map((p) => p.name ?? ""),
      isWinner: matchResult.is_winner ?? false,
      totalPoints: matchResult.total_points ?? 0,
      currentMatchEndId: matchEnd.id,
      isConfirmed: matchEnd.is_confirmed ?? false,
      capacity: matchEnd.match_scores?.length ?? 0,
      scores,
      totalScores: matchEnd.total_scores ?? scores.reduce((total, score) => total + scorefmt(score.score), 0),
      dirty: false, // 初始化即與伺服器一致，尚無本地未存的編輯
    };
    return [local];
  });
}

export default function Page({ params }: { params: { id: string } }) {
  const competitionId = parseInt(params.id);
  const status = useCurrentEliminationMatch(competitionId);
  const queryClient = useQueryClient();

  const dispatch = useAppDispatch();
  const matchResults = useAppSelector(
    (state) => state.eliminationScoring.matchResults
  );
  const selectedMatchResultIdentifier = useAppSelector(
    (state) => state.eliminationScoring.selectedMatchResultIdentifier
  );
  const isSaving = useAppSelector(
    (state) => state.eliminationScoring.isSaving
  );
  const saveError = useAppSelector(
    (state) => state.eliminationScoring.saveError
  );

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  // 避免初始化被誤判為使用者剛填滿容量而觸發自動存分。
  const isLocalRefreshRef = useRef(false);
  const prevSelectedIdRef = useRef<number>(-1);
  const prevFilledCountRef = useRef<number | null>(null);

  const readyMatchId = status.kind === "ready" ? status.data.match.id : undefined;
  const readyEndIndex =
    status.kind === "ready" ? status.data.currentEndIndex : undefined;
  const isClosed = status.kind === "ready" &&
    (status.data.group.bow_type === "Recurve" || status.data.group.bow_type === "反曲弓") &&
    status.data.matchResults.some((result) => result.is_winner);
  const confirmationEndIndex = isClosed && status.kind === "ready"
    ? recurveClosingEnd(status.data.matchResults, status.data.teamSize)
    : undefined;
  const displayedMatchResults = isClosed && status.kind === "ready"
    ? toLocalMatchResults(
        status.data.matchResults,
        confirmationEndIndex ?? status.data.currentEndIndex,
        status.data.elimination.player_sets ?? [],
      )
    : matchResults;

  // ready 時，把該對局資料轉換並整批灌入 slice。
  useEffect(() => {
    if (status.kind !== "ready") return;
    // Keep abandoned drafts for the warning; the closed board reads saved scores directly.
    if (isClosed && matchResults.some((local) =>
      status.data.matchResults.some((result) => result.id === local.matchResultId)
    )) return;
    isLocalRefreshRef.current = true;
    dispatch(
      initializeMatchResults({
        matchResults: toLocalMatchResults(
          status.data.matchResults,
          status.data.currentEndIndex,
          status.data.elimination.player_sets ?? []
        ),
        currentEndIndex: status.data.currentEndIndex,
        teamSize: status.data.teamSize,
        selectedMatchResultIdentifier: status.data.myMatchResultId,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyMatchId, readyEndIndex, isClosed]);

  const selectedMatchResult = displayedMatchResults.find(
    (mr) => mr.matchResultId === selectedMatchResultIdentifier
  );

  // 存分：以「選中側排序後之 LocalMatchScore[]」衍生 match_score_ids/scores，確保 id↔score 對應。
  const { mutate: saveScores } = useMutation(
    async (target: LocalMatchResult) => {
      const matchScoreIds = target.scores.map((s) => s.id);
      const scores = target.scores.map((s) => s.score);
      const totalScores = scores.reduce((sum, s) => sum + scorefmt(s), 0);
      await apiClient.matchEnd.matchendScoresPartialUpdate(
        target.currentMatchEndId,
        {
          match_score_ids: matchScoreIds,
          scores,
          total_scores: totalScores,
        }
      );
      return {
        matchResultId: target.matchResultId,
        currentMatchEndId: target.currentMatchEndId,
        scores: target.scores,
        totalScores,
        eliminationId: status.kind === "ready" ? status.data.elimination.id : undefined,
      };
    },
    {
      onMutate: () => {
        // 存分開始即清除舊的錯誤狀態，避免確認守衛誤判「上一次失敗」而永久卡住。
        dispatch(setSaveError(null));
        dispatch(setSaving(true));
      },
      onSuccess: ({ matchResultId, currentMatchEndId, scores, totalScores, eliminationId }) => {
        dispatch(setSaving(false));
        dispatch(setSaveError(null));
        // 存分成功不改 is_confirmed/total_points/is_winner/current_end，僅回填本波分數。
        dispatch(
          replaceSavedMatchEnd({ matchResultId, currentMatchEndId, scores, totalScores })
        );
        if (eliminationId !== undefined) {
          // 重取伺服器衍生的雙方積點；同輪同波不會重新初始化本地草稿。
          void queryClient.invalidateQueries(
            ["eliminationDetail", eliminationId],
            { exact: true }
          );
        }
        setSnackbar({ open: true, severity: "success", message: "已儲存分數" });
      },
      onError: (error: unknown) => {
        dispatch(setSaving(false));
        const message = error instanceof Error ? error.message : "儲存分數失敗";
        dispatch(setSaveError(message));
        // 失敗時保留本地未送資料，不回滾。
        setSnackbar({ open: true, severity: "error", message: "儲存分數失敗，請稍後再試" });
      },
    }
  );

  // 確認：僅呼叫 isconfirmed 端點，不重算/重送分數，不動 total_points/is_winner/current_end。
  const { mutate: confirmEnd, isLoading: isConfirming } = useMutation(
    async (target: LocalMatchResult) => {
      await apiClient.matchEnd.matchendIsconfirmedPartialUpdate(
        target.currentMatchEndId,
        { is_confirmed: true }
      );
      return {
        matchResultId: target.matchResultId,
        currentMatchEndId: target.currentMatchEndId,
        eliminationId: status.kind === "ready" ? status.data.elimination.id : undefined,
      };
    },
    {
      onSuccess: async (target) => {
        dispatch(markConfirmed(target));
        if (target.eliminationId !== undefined) {
          const key = ["eliminationDetail", target.eliminationId];
          // The confirmation is already saved; retain it even if the following read fails.
          queryClient.setQueryData<EliminationDetailResponse | undefined>(key, (cached) => {
            if (!cached) return cached;
            const data = structuredClone(cached.data);
            for (const stage of data.stages ?? []) {
              for (const match of stage.matchs ?? []) {
                for (const result of match.match_results ?? []) {
                  const end = result.match_ends?.find((end) => end.id === target.currentMatchEndId);
                  if (end) end.is_confirmed = true;
                }
              }
            }
            return { ...cached, data };
          });
          await queryClient.invalidateQueries(key, { exact: true }, { cancelRefetch: true });
        }
        setSnackbar({ open: true, severity: "success", message: "已確認本波" });
      },
      onError: () => {
        setSnackbar({
          open: true,
          severity: "error",
          message: "確認失敗，請稍後再試",
        });
      },
    }
  );

  // 自動儲存：選中側由未滿轉為填滿容量時自動觸發存分；guard 避免初始化後重觸，
  // 亦避免切換選中側時被舊的填滿狀態誤判。
  useEffect(() => {
    if (isClosed) return;
    if (!selectedMatchResult) {
      prevFilledCountRef.current = null;
      prevSelectedIdRef.current = selectedMatchResultIdentifier;
      return;
    }

    const filledCount = selectedMatchResult.scores.filter(
      (s) => s.score !== -1
    ).length;

    const justRefreshed = isLocalRefreshRef.current;
    const justSwitched =
      prevSelectedIdRef.current !== selectedMatchResultIdentifier;
    isLocalRefreshRef.current = false;
    prevSelectedIdRef.current = selectedMatchResultIdentifier;

    if (justRefreshed || justSwitched) {
      prevFilledCountRef.current = filledCount;
      return;
    }

    const prevFilledCount = prevFilledCountRef.current;
    prevFilledCountRef.current = filledCount;

    if (
      selectedMatchResult.dirty &&
      prevFilledCount !== null &&
      prevFilledCount < selectedMatchResult.capacity &&
      filledCount >= selectedMatchResult.capacity
    ) {
      saveScores(selectedMatchResult);
    }
  }, [selectedMatchResult, selectedMatchResultIdentifier, saveScores, isClosed]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (status.kind !== "ready") {
    return <EliminationScoringStates status={status} />;
  }

  return (
    <>
      {isClosed ? (
        <ClosedEliminationScoringBoard
          data={status.data}
          matchResults={displayedMatchResults}
          selectedMatchResultIdentifier={selectedMatchResultIdentifier}
          confirmationEndIndex={confirmationEndIndex}
          isBusy={isSaving || isConfirming}
          hasUnsavedChanges={matchResults.some((result) => result.dirty)}
          onSelect={(id) => dispatch(selectMatchResult(id))}
          onConfirm={() => {
            if (isSaving || isConfirming || confirmationEndIndex === undefined || !selectedMatchResult || selectedMatchResult.isConfirmed) return;
            confirmEnd(selectedMatchResult);
          }}
        />
      ) : (
      <EliminationScoringBoard
        data={status.data}
        matchResults={matchResults}
        selectedMatchResultIdentifier={selectedMatchResultIdentifier}
        isSaving={isSaving}
        onSelectMatchResult={(matchResultId) =>
          dispatch(selectMatchResult(matchResultId))
        }
        onAddScore={(score) => dispatch(addScore(score))}
        onDeleteScore={() => dispatch(deleteScore())}
        onSave={() => {
          // 已確認一方之送出鈕僅以 isSaving 停用、仍可被點擊；於此再擋一次，
          // 避免對已確認之 MatchEnd 誤打存分 API（後端 is_confirmed guard 會回 400）。
          if (selectedMatchResult && !selectedMatchResult.isConfirmed) {
            saveScores(selectedMatchResult);
          }
        }}
        onConfirm={() => {
          // 已確認者不重覆呼叫確認端點。
          if (!selectedMatchResult || selectedMatchResult.isConfirmed) return;
          // 確認前守衛：若本地有尚未成功存分的編輯（dirty）或上次存分失敗（saveError），
          // 一律拒絕呼叫確認 API——避免「確認成功但分數從未持久化」之後 is_confirmed 鎖死無法補救。
          if (selectedMatchResult.dirty || saveError !== null) {
            setSnackbar({
              open: true,
              severity: "error",
              message: "請先成功儲存分數後再確認",
            });
            return;
          }
          confirmEnd(selectedMatchResult);
        }}
      />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
