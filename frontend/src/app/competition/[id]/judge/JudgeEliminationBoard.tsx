"use client";

import EliminationMatchScoreComparison from "@/components/EliminationMatchScoreComparison";
import LaneNumber from "@/components/LaneNumber";
import ScoreBlock from "@/components/ScoreBlock";
import ScoreController from "@/components/ScoreController/ScoreController";
import {
  DatabaseElimination,
  DatabaseMatch,
  DatabaseMatchEnd,
  DatabaseMatchResult,
  EndpointCompetitionWGroupsQuaEliData,
} from "@/types/Api";
import { apiClient } from "@/utils/ApiClient";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import useGetCompetitionProgress from "@/utils/QueryHooks/useGetCompetitionProgress";

const POSSIBLE_SCORES = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const EVENT_NAMES: Record<number, string> = { 1: "個人對抗賽", 2: "混雙對抗賽", 3: "團體對抗賽" };

type Draft = {
  end: DatabaseMatchEnd;
  playerSetName: string;
  matchNumber: number;
  stageIndex: number;
  endIndex: number;
  laneNumber?: number;
  target?: DatabaseMatchResult["target"];
  dirty: boolean;
};

function activeTeamSizes(competition?: { elimination_is_active?: boolean; mixed_elimination_is_active?: boolean; team_elimination_is_active?: boolean }) {
  return [
    competition?.elimination_is_active ? 1 : null,
    competition?.mixed_elimination_is_active ? 2 : null,
    competition?.team_elimination_is_active ? 3 : null,
  ].filter((teamSize): teamSize is number => teamSize !== null);
}

function teamName(result: DatabaseMatchResult | undefined, elimination?: DatabaseElimination) {
  if (!result?.player_set_id) return "空席";
  return elimination?.player_sets?.find((set) => set.id === result.player_set_id)?.set_name ?? "隊伍";
}

function cloneEnd(end: DatabaseMatchEnd): DatabaseMatchEnd {
  return {
    ...end,
    // 不清除 is_confirmed：裁判改已確認波時，送出後應保持確認狀態。
    match_scores: end.match_scores?.map((score) => ({ ...score })),
  };
}

function scoreTotal(end: DatabaseMatchEnd) {
  return (end.match_scores ?? []).reduce(
    (sum, item) => sum + (item.score === 11 ? 10 : item.score && item.score > 0 ? item.score : 0),
    0,
  );
}

function endStatus(match: DatabaseMatch, endIndex: number) {
  if (match.outcome_status === "shoot_off") return "需加射";
  if (match.outcome_status === "winner") return "已完成";
  const results = match.match_results ?? [];
  if (results.some((result) => result.match_ends?.[endIndex]?.is_confirmed)) return "已確認";
  return "未完成";
}

export default function JudgeEliminationBoard({ competitionId }: { competitionId: number }) {
  const queryClient = useQueryClient();
  const { data: competition } = useGetCompetitionProgress(competitionId);
  const { data: groupsData, isLoading: isGroupsLoading, isError: isGroupsError } = useQuery(
    ["judgeGroupsEliminations", competitionId],
    () => apiClient.competition.groupsEliminationsDetail(competitionId),
    { select: (response) => response.data as EndpointCompetitionWGroupsQuaEliData, refetchInterval: 2000 },
  );
  const [groupId, setGroupId] = useState<number | "">("");
  const [teamSize, setTeamSize] = useState<number | "">("");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [visibleStageIndex, setVisibleStageIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(
    () => (groupsData?.group_data ?? []).filter((group) => {
      if (group.group_id === competition?.unassigned_group_id) return false;
      const active = activeTeamSizes(competition);
      return (group.elimination_data ?? []).some(
        (item) => item.elimination_id !== undefined && active.includes(item.team_size ?? -1),
      );
    }),
    [competition, groupsData?.group_data],
  );
  const selectedGroup = groups.find((group) => group.group_id === groupId);
  const availableTeamSizes = useMemo(() => {
    const active = activeTeamSizes(competition);
    return (selectedGroup?.elimination_data ?? [])
      .map((item) => item.team_size)
      .filter((size): size is number => size !== undefined && active.includes(size));
  }, [competition, selectedGroup]);
  const selectedEliminationId = selectedGroup?.elimination_data?.find(
    (item) => item.team_size === teamSize,
  )?.elimination_id;
  const { data: elimination, isLoading: isEliminationLoading, isError: isEliminationError } = useQuery(
    ["judgeEliminationDetail", selectedEliminationId],
    () => apiClient.elimination.stagesScoresMedalsDetail(selectedEliminationId as number),
    {
      enabled: selectedEliminationId !== undefined,
      select: (response) => response.data as DatabaseElimination,
      refetchInterval: selectedEliminationId !== undefined ? 2000 : false,
    },
  );
  const isDirty = draft?.dirty ?? false;
  const currentStageIndex = elimination?.current_stage ?? -1;
  const currentEndIndex = elimination?.current_end ?? -1;

  useEffect(() => {
    if (groupId === "" && groups[0]?.group_id !== undefined) setGroupId(groups[0].group_id);
  }, [groupId, groups]);
  useEffect(() => {
    if (teamSize !== "" && !availableTeamSizes.includes(teamSize)) setTeamSize("");
    if (teamSize === "" && availableTeamSizes.length) {
      const byPhase = competition?.current_phase === 1 ? 1 : competition?.current_phase === 2 ? 3 : competition?.current_phase === 3 ? 2 : undefined;
      setTeamSize(availableTeamSizes.includes(byPhase ?? -1) ? (byPhase as number) : availableTeamSizes[0]);
    }
  }, [availableTeamSizes, competition?.current_phase, teamSize]);
  useEffect(() => {
    if (!elimination) return;
    if (visibleStageIndex === null) setVisibleStageIndex(currentStageIndex);
    else if (visibleStageIndex !== currentStageIndex) {
      if (isDirty) setNotice("目前階段已變更；請先儲存或保留本波草稿後再切換。");
      else setVisibleStageIndex(currentStageIndex);
    }
  }, [currentStageIndex, elimination, isDirty, visibleStageIndex]);

  const stage = visibleStageIndex === null ? undefined : elimination?.stages?.[visibleStageIndex];
  const matches = useMemo(
    () => [...(stage?.matchs ?? [])].sort((left, right) => (left.id ?? 0) - (right.id ?? 0)),
    [stage?.matchs],
  );
  const selectedMatch = matches.find((match) => match.id === selectedMatchId);

  useEffect(() => {
    if (!isDirty && selectedMatchId !== null && !selectedMatch) setSelectedMatchId(null);
  }, [isDirty, selectedMatch, selectedMatchId]);

  const preventScopeChange = () => {
    if (!isDirty) return false;
    setNotice("此波尚有未儲存草稿；請先送出，或保留草稿後再處理目前範圍。");
    return true;
  };
  const chooseGroup = (next: number) => {
    if (preventScopeChange()) return;
    setGroupId(next); setTeamSize(""); setSelectedMatchId(null); setVisibleStageIndex(null);
  };
  const chooseTeamSize = (next: number) => {
    if (preventScopeChange()) return;
    setTeamSize(next); setSelectedMatchId(null); setVisibleStageIndex(null);
  };
  const chooseMatch = (next: number) => {
    if (preventScopeChange()) return;
    setSelectedMatchId(next);
  };

  const refresh = async () => {
    await queryClient.invalidateQueries(["judgeEliminationDetail", selectedEliminationId]);
    await queryClient.invalidateQueries(["judgeGroupsEliminations", competitionId]);
  };
  const { mutate: saveEnd, isLoading: isSaving } = useMutation(
    async (toSave: Draft) => {
      if (!toSave.end.id || !toSave.end.match_scores?.length) throw new Error("本波沒有可送出的完整箭分資料。");
      const matchScoreIds = toSave.end.match_scores.map((score) => {
        if (!score.id) throw new Error("缺少箭分 ID。");
        return score.id;
      });
      const scores = toSave.end.match_scores.map((score) => score.score ?? -1);
      await apiClient.matchEnd.matchendScoresPartialUpdate(toSave.end.id, {
        match_score_ids: matchScoreIds,
        scores,
        total_scores: scoreTotal(toSave.end),
      });
    },
    {
      onSuccess: async () => {
        setDraft(null); setEditorOpen(false); setError(null); setNotice("本波已儲存。"); await refresh();
      },
      onError: (reason: any) => setError(reason?.response?.data?.error ?? reason?.message ?? "儲存失敗；草稿仍保留。"),
    },
  );
  const { mutate: confirmEnd, isLoading: isConfirming } = useMutation(
    (endId: number) => apiClient.matchEnd.matchendIsconfirmedPartialUpdate(endId, { is_confirmed: true }),
    {
      onSuccess: async () => { setError(null); setNotice("本波已確認。"); await refresh(); },
      onError: (reason: any) => setError(reason?.response?.data?.error ?? "確認失敗。"),
    },
  );

  const openEnd = (end: DatabaseMatchEnd) => {
    if (draft?.dirty && draft.end.id !== end.id) {
      setNotice("此波尚有未儲存草稿；請先送出後再編輯其他波次。");
      return;
    }
    if (draft?.end.id === end.id) {
      setEditorOpen(true);
      return;
    }
    const result = selectedMatch?.match_results?.find((item) => item.id === end.match_result_id);
    setDraft({
      end: cloneEnd(end),
      playerSetName: teamName(result, elimination),
      matchNumber: matches.findIndex((match) => match.id === selectedMatch?.id) + 1,
      stageIndex: visibleStageIndex ?? currentStageIndex,
      endIndex: result?.match_ends?.findIndex((item) => item.id === end.id) ?? -1,
      laneNumber: result?.lane_number,
      target: result?.target,
      dirty: false,
    });
    setError(null); setEditorOpen(true);
  };
  const addScore = (score: number) => setDraft((old) => {
    const scores = old?.end.match_scores;
    const index = scores?.findIndex((item) => (item.score ?? -1) === -1) ?? -1;
    if (!old || !scores || index < 0) return old;
    return { ...old, dirty: true, end: { ...old.end, match_scores: scores.map((item, i) => i === index ? { ...item, score } : item) } };
  });
  const deleteScore = () => setDraft((old) => {
    const scores = old?.end.match_scores;
    if (!old || !scores) return old;
    const target = scores.reduce(
      (lastFilled, item, index) => ((item.score ?? -1) >= 0 ? index : lastFilled),
      -1,
    );
    if (target < 0) return old;
    return { ...old, dirty: true, end: { ...old.end, match_scores: scores.map((item, i) => i === target ? { ...item, score: -1 } : item) } };
  });

  if (isGroupsLoading) return <Typography sx={{ p: 2 }}>正在載入可裁判的組別…</Typography>;
  if (isGroupsError) return <Alert severity="error">無法載入組別與對抗賽資料。</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: 1, pb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>裁判記分</Typography>
      <Stack spacing={1.25}>
        <FormControl size="small" fullWidth>
          <InputLabel id="judge-group-label">組別</InputLabel>
          <Select labelId="judge-group-label" label="組別" value={groupId} onChange={(event) => chooseGroup(Number(event.target.value))}>
            {groups.map((group) => <MenuItem key={group.group_id} value={group.group_id}>{group.group_name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth disabled={!availableTeamSizes.length}>
          <InputLabel id="judge-event-label">項目</InputLabel>
          <Select labelId="judge-event-label" label="項目" value={teamSize} onChange={(event) => chooseTeamSize(Number(event.target.value))}>
            {availableTeamSizes.map((size) => <MenuItem key={size} value={size}>{EVENT_NAMES[size]}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      {!availableTeamSizes.length && <Alert severity="info" sx={{ mt: 2 }}>此組別沒有已開啟且已建立的對抗賽項目。</Alert>}
      {isEliminationLoading && <Typography sx={{ mt: 2 }}>正在載入目前對抗賽…</Typography>}
      {isEliminationError && <Alert severity="error" sx={{ mt: 2 }}>無法載入本項目的對抗賽。</Alert>}
      {elimination && stage && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>目前階段：第 {currentStageIndex + 1} 階段・第 {currentEndIndex + 1} 波</Typography>
          <Stack spacing={1} sx={{ mt: 1 }} aria-label="選擇對抗組">
            {matches.map((match, index) => {
              const results = match.match_results ?? [];
              const editable = results.length === 2 && results.every((result) => Boolean(result.player_set_id));
              return <Card key={match.id ?? index} variant="outlined" sx={{ p: 1, opacity: editable ? 1 : 0.55 }}>
                <Button fullWidth disabled={!editable} onClick={() => match.id !== undefined && chooseMatch(match.id)} sx={{ textTransform: "none", justifyContent: "flex-start", color: "text.primary" }}>
                  <Stack direction="row" spacing={1} alignItems="center" width="100%">
                    <Typography fontWeight={700}>Match {index + 1}</Typography>
                    <LaneNumber laneNumber={results[0]?.lane_number} target={results[0]?.target} width="36px" height="28px" />
                    <Typography variant="body2" sx={{ flex: 1, textAlign: "left" }}>{teamName(results[0], elimination)} vs {teamName(results[1], elimination)}</Typography>
                    <LaneNumber laneNumber={results[1]?.lane_number} target={results[1]?.target} width="36px" height="28px" />
                    <Chip size="small" label={editable ? endStatus(match, currentEndIndex) : "空席／輪空"} color={match.outcome_status === "shoot_off" ? "warning" : "default"} />
                  </Stack>
                </Button>
              </Card>;
            })}
          </Stack>
          {matches.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>目前階段尚無對抗組。</Alert>}
        </>
      )}
      {selectedMatch && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Match {matches.findIndex((match) => match.id === selectedMatch.id) + 1} 比分</Typography>
          <EliminationMatchScoreComparison
            side1={{ label: teamName(selectedMatch.match_results?.[0], elimination), matchResult: selectedMatch.match_results?.[0] }}
            side2={{ label: teamName(selectedMatch.match_results?.[1], elimination), matchResult: selectedMatch.match_results?.[1] }}
            currentEndIndex={currentEndIndex}
            allowUnconfirm={false}
            disabled={isSaving || isConfirming}
            onEditEnd={openEnd}
            onToggleConfirmation={(end, isConfirmed) => {
              if (!isConfirmed || !end.id) return;
              if (isDirty) { setNotice("請先儲存目前草稿後再確認波次。"); return; }
              confirmEnd(end.id);
            }}
          />
        </Box>
      )}
      {isDirty && !isEditorOpen && (
        <Alert
          severity="warning"
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (window.confirm("要放棄這份未儲存草稿嗎？")) {
                  setDraft(null);
                  setVisibleStageIndex(currentStageIndex);
                  setSelectedMatchId(null);
                  setNotice("已放棄草稿，已切換至目前階段。");
                }
              }}
            >
              放棄草稿
            </Button>
          }
        >
          此波草稿尚未儲存；範圍切換已暫停。
        </Alert>
      )}
      <Dialog fullScreen open={isEditorOpen} onClose={() => !isSaving && setEditorOpen(false)} aria-labelledby="judge-score-editor-title">
        <DialogTitle id="judge-score-editor-title">編輯第 {draft ? draft.endIndex + 1 : ""} 波</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Typography variant="body2">{selectedGroup?.group_name}・{teamSize === "" ? "" : EVENT_NAMES[teamSize]}・第 {(draft?.stageIndex ?? currentStageIndex) + 1} 階段・Match {draft?.matchNumber}・第 {draft ? draft.endIndex + 1 : ""} 波</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <LaneNumber laneNumber={draft?.laneNumber} target={draft?.target} width="40px" height="30px" />
              <Typography variant="body2">{draft?.playerSetName}・{draft?.end.is_confirmed ? "已確認（改分後維持確認）" : "未確認"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap">
              {(draft?.end.match_scores ?? []).map((score, index) => score.score !== undefined && score.score >= 0 ? <ScoreBlock key={score.id ?? index} score={score.score} /> : <Typography key={score.id ?? index}>—</Typography>)}
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <ScoreController
              scores={(draft?.end.match_scores ?? []).map((score) => score.score ?? -1)}
              isConfirmed={draft?.end.is_confirmed ?? false}
              allowConfirmedEditing
              maximumArrowCount={draft?.end.match_scores?.length ?? 0}
              possibleScores={POSSIBLE_SCORES}
              onAddScore={addScore}
              onDeleteScore={deleteScore}
              onSave={() => draft && saveEnd(draft)}
              isSaving={isSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)} disabled={isSaving}>保留草稿並返回</Button>
          <Button
            color="warning"
            disabled={isSaving || !draft?.dirty}
            onClick={() => {
              if (window.confirm("要放棄這份未儲存草稿嗎？")) {
                setDraft(null);
                setEditorOpen(false);
                setVisibleStageIndex(currentStageIndex);
                setSelectedMatchId(null);
                setNotice("已放棄草稿，已切換至目前階段。");
              }
            }}
          >
            放棄草稿
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}><Alert severity="info" onClose={() => setNotice(null)}>{notice}</Alert></Snackbar>
    </Box>
  );
}
