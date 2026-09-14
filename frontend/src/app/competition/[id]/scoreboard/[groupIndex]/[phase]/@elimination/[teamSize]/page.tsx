"use client";

import { useCallback, useMemo, useState } from "react";
import EliminationMatchScoreComparison from "@/components/EliminationMatchScoreComparison";
import EliminationTreeChart from "@/components/EliminationTreeChart";
import CloseIcon from "@mui/icons-material/Close";
import { parseStagesToTree } from "@/utils/parseStagesToTree";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { isCompleteEliminationBracket } from "@/utils/eliminationBracket";
import { formatLanePlacement } from "@/utils/eliminationPlacement";
import { isCompoundBowType, totalMatchScore } from "@/utils/eliminationScore";
import type { DatabaseMatch, DatabaseMatchResult, DatabasePlayerSet, DatabaseStage } from "@/types/Api";
import { Box, ButtonBase, Chip, Dialog, DialogContent, DialogTitle, Divider, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

function playerSetFor(result: DatabaseMatchResult | undefined, playerSets: DatabasePlayerSet[]) {
  return result?.player_set ?? playerSets.find((set) => set.id === result?.player_set_id);
}

function teamName(result: DatabaseMatchResult | undefined, playerSets: DatabasePlayerSet[]) {
  const set = playerSetFor(result, playerSets);
  return set ? `No.${set.rank ?? "—"} ${set.set_name ?? "未命名隊伍"}` : "待定";
}

function teamMembers(result: DatabaseMatchResult | undefined, playerSets: DatabasePlayerSet[]) {
  const players = playerSetFor(result, playerSets)?.players ?? [];
  return players.length ? players.map((player) => player.name ?? "未命名選手").join("、") : "尚無成員資料";
}

function laneLabel(result: DatabaseMatchResult | undefined) {
  return result?.lane_number !== undefined
    ? formatLanePlacement(result.lane_number, result.target) || "—"
    : "—";
}

function stageLabel(stage: DatabaseStage, stageIndex: number, stageCount: number) {
  if (stageIndex === stageCount - 1) return "決賽";
  if (stageIndex === stageCount - 2) return "準決賽";
  return `1/${Math.max(2, (stage.matchs?.length ?? 1) * 2)}`;
}

function DetailTeamHeader({ result, playerSets }: { result?: DatabaseMatchResult; playerSets: DatabasePlayerSet[] }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{teamName(result, playerSets)}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>成員：{teamMembers(result, playerSets)}</Typography>
      <Typography variant="caption" color="text.secondary">靶位：{laneLabel(result)}</Typography>
    </Stack>
  );
}

function MobileTeamRow({ result, playerSets, bowType, onClick }: { result?: DatabaseMatchResult; playerSets: DatabasePlayerSet[]; bowType?: string; onClick: () => void }) {
  const playable = result?.player_set_id !== undefined && result.match_id !== undefined;
  const isCompound = isCompoundBowType(bowType);
  return (
    <ButtonBase
      disabled={!playable}
      onClick={onClick}
      aria-label={playable ? `查看 ${teamName(result, playerSets)} 的 Match #${result?.match_id} 比分` : "待定隊伍"}
      sx={{ alignItems: "stretch", borderRadius: 1, display: "block", opacity: playable ? 1 : 0.55, textAlign: "left", width: "100%", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, px: 0.75, py: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={result?.is_winner ? 700 : 500} noWrap>{teamName(result, playerSets)}</Typography>
          <Typography variant="caption" color="text.secondary">靶位 {laneLabel(result)} ・ {isCompound ? "總分" : "積點"} {isCompound ? totalMatchScore(result) ?? "—" : result?.total_points ?? "—"}</Typography>
        </Box>
        {result?.is_winner && <Chip label="勝方" color="success" size="small" />}
      </Stack>
    </ButtonBase>
  );
}

function MobileStages({ stages, playerSets, bowType, onMatchSelect }: { stages: DatabaseStage[]; playerSets: DatabasePlayerSet[]; bowType?: string; onMatchSelect: (match: DatabaseMatch) => void }) {
  return (
    <Stack data-testid="elimination-mobile-stages" spacing={1}>
      {stages.map((stage, stageIndex) => (
        <Box component="section" key={stage.id ?? stageIndex} aria-label={stageLabel(stage, stageIndex, stages.length)}>
          <Typography color="primary" fontWeight={700} variant="subtitle2" sx={{ mb: 0.5 }}>{stageLabel(stage, stageIndex, stages.length)}</Typography>
          <Stack spacing={0.75}>
            {(stage.matchs ?? []).map((match, matchIndex) => (
              <Paper key={match.id ?? matchIndex} data-testid={`elimination-mobile-match-${match.id ?? matchIndex}`} variant="outlined" sx={{ overflow: "hidden" }}>
                <Box sx={{ bgcolor: "action.hover", px: 0.75, py: 0.35 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {stageIndex === stages.length - 1 && matchIndex === 0 ? "金牌賽" : stageIndex === stages.length - 1 && matchIndex === 1 ? "銅牌賽" : `${matchIndex + 1}/${stage.matchs?.length ?? 0}`}
                  </Typography>
                </Box>
                <MobileTeamRow result={match.match_results?.[0]} playerSets={playerSets} bowType={bowType} onClick={() => onMatchSelect(match)} />
                <Divider />
                <MobileTeamRow result={match.match_results?.[1]} playerSets={playerSets} bowType={bowType} onClick={() => onMatchSelect(match)} />
              </Paper>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export default function Page({ params }: { params: { id: string; groupIndex: string; teamSize: string } }) {
  const teamSize = parseInt(params.teamSize);
  const competitionId = parseInt(params.id);
  const groupIndex = parseInt(params.groupIndex);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: elimination } = useGetElimination(competitionId, groupIndex, teamSize);
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const { data: eliminationDetail } = useGetEliminationDetail(elimination?.elimination_id);
  const bowType = competition?.groups?.find((group) => group.group_index === groupIndex)?.bow_type;
  const stages = useMemo(() => eliminationDetail?.stages ?? [], [eliminationDetail?.stages]);
  const playerSets = eliminationDetail?.player_sets ?? [];
  const selectedMatch = useMemo(() => stages.flatMap((stage) => stage.matchs ?? []).find((match) => match.id === selectedMatchId), [selectedMatchId, stages]);
  const { goldRoot, silverRoot, bronzeRoot } = useMemo(
    () => parseStagesToTree(stages),
    [stages]
  );
  const selectMatch = useCallback(
    (match: DatabaseMatch) =>
      match.id !== undefined && setSelectedMatchId(match.id),
    []
  );
  const selectResult = useCallback(
    (result: DatabaseMatchResult) =>
      result.match_id !== undefined && setSelectedMatchId(result.match_id),
    []
  );

  if (!elimination || !eliminationDetail) return <Typography>Loading...</Typography>;
  if (!isCompleteEliminationBracket(stages)) return <Typography>尚未建立完整對抗樹。</Typography>;

  const firstStage = stages[0];
  const firstStageMatchCount = firstStage?.matchs?.length ?? 0;
  const advancingNum = firstStageMatchCount * 2;
  const chartWidth = (Math.ceil(Math.log2(advancingNum)) + 1) * 200;
  return (
    <>
      {/* 暫時於手機亦保留淘汰樹，供比較卡片版與樹狀版的可讀性。 */}
      <Box data-testid="elimination-desktop-tree" sx={{ display: "block", overflowX: "auto" }}>
        <Box sx={{ mx: "auto", width: "max-content" }}>
          <EliminationTreeChart goldRoot={goldRoot} silverRoot={silverRoot} bronzeRoot={bronzeRoot} playerSets={playerSets} height={firstStageMatchCount * 100} width={chartWidth} onResultClick={selectResult} />
        </Box>
      </Box>
      <Box sx={{ display: "none", maxWidth: "100%", overflowX: "hidden", px: 0.5 }}>
        <MobileStages stages={stages} playerSets={playerSets} bowType={bowType} onMatchSelect={selectMatch} />
      </Box>
      <Dialog open={Boolean(selectedMatch)} onClose={() => setSelectedMatchId(null)} fullScreen={isMobile} fullWidth maxWidth="md" aria-labelledby="elimination-score-detail-title">
        {selectedMatch && <>
          <DialogTitle id="elimination-score-detail-title" sx={{ py: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography component="span" variant="h6">Match #{selectedMatch.id} 比分詳細資料</Typography>
              <IconButton aria-label="關閉比分詳細資料" edge="end" onClick={() => setSelectedMatchId(null)}><CloseIcon /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ overflowX: "hidden", px: { xs: 0.75, sm: 3 }, pb: 2 }}>
            <Box sx={{ pt: 0.5 }}>
              <EliminationMatchScoreComparison
                side1={{ label: teamName(selectedMatch.match_results?.[0], playerSets), matchResult: selectedMatch.match_results?.[0], header: <DetailTeamHeader result={selectedMatch.match_results?.[0]} playerSets={playerSets} /> }}
                side2={{ label: teamName(selectedMatch.match_results?.[1], playerSets), matchResult: selectedMatch.match_results?.[1], header: <DetailTeamHeader result={selectedMatch.match_results?.[1]} playerSets={playerSets} /> }}
                bowType={bowType}
                denseOnMobile
                showConfirmation={false}
                showPredictionIndicator={false}
              />
            </Box>
          </DialogContent>
        </>}
      </Dialog>
    </>
  );
}
