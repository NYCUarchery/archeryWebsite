"use client";

import EditIcon from "@mui/icons-material/Edit";
import ScoreBlock from "@/components/ScoreBlock";
import ScoreController from "@/components/ScoreController/ScoreController";
import StatisticRow from "@/components/ScoreDetail/StatisticRow";
import { DatabaseRoundEnd } from "@/types/Api";
import { Player } from "@/types/oldRef/Player";
import { apiClient } from "@/utils/ApiClient";
import useGetCompetitionPlayers from "@/utils/QueryHooks/useGetCompetitionPlayers";
import { calculatePlayerStats } from "@/utils/calculatePlayerStatistics";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

function cloneEnd(end: DatabaseRoundEnd): DatabaseRoundEnd {
  return {
    ...end,
    round_scores: end.round_scores?.map((score) => ({ ...score })),
  };
}

function endTotal(end: DatabaseRoundEnd): number {
  return (end.round_scores ?? []).reduce((total, score) => {
    if (score.score === 11) return total + 10;
    return score.score === undefined || score.score < 0 ? total : total + score.score;
  }, 0);
}

const qualificationScoreSize = "clamp(0.75rem, 3vw, 1.25rem)";

function QualificationScoreSlot({ score }: { score: number | undefined }) {
  if (score === undefined || score < 0) {
    return (
      <Box
        aria-label="未填分數"
        className="qualification-score-placeholder"
        sx={{
          fontSize: qualificationScoreSize,
          width: "1.85em",
          height: "1.3em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        —
      </Box>
    );
  }

  return <ScoreBlock score={score} size={qualificationScoreSize} />;
}

/**
 * 原管理端資格賽記分器。Judge 與 Admin 均經此元件記分；手機只縮原表格與 Dialog，
 * 不另維護第二套波次／草稿 UI。
 */
export default function QualificationScoreEditor({
  competitionId,
}: {
  competitionId: number;
}) {
  const queryClient = useQueryClient();
  const { data: players } = useGetCompetitionPlayers(competitionId);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    label: string;
    value: number;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedEnd, setSelectedEnd] = useState<DatabaseRoundEnd | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: player } = useQuery(
    ["qualificationScoreEditorPlayer", selectedPlayer?.value],
    () => apiClient.player.scoresDetail(selectedPlayer!.value),
    {
      select: (response) => response.data,
      enabled: selectedPlayer !== null,
    },
  );

  const { mutate: saveScores, isLoading: isSavingScores } = useMutation(
    (end: DatabaseRoundEnd) =>
      apiClient.player.allEndscoresPartialUpdate(end.id as number, {
        scores: (end.round_scores ?? []).map((score) => score.score ?? -1),
      }),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries([
          "qualificationScoreEditorPlayer",
          selectedPlayer?.value,
        ]);
        setSelectedEnd(null);
        setDirty(false);
        setScoreDialogOpen(false);
        setError(null);
      },
      onError: (reason: any) => {
        setError(reason?.response?.data?.error ?? "儲存失敗；草稿仍保留。");
      },
    },
  );

  const { mutate: confirmEnd, isLoading: isConfirming } = useMutation(
    (endId: number) =>
      apiClient.player.isconfirmedPartialUpdate(endId, { is_confirmed: true }),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries([
          "qualificationScoreEditorPlayer",
          selectedPlayer?.value,
        ]);
        setSelectedEnd(null);
        setDirty(false);
        setScoreDialogOpen(false);
        setError(null);
      },
      onError: (reason: any) => {
        setError(reason?.response?.data?.error ?? "確認失敗。");
      },
    },
  );

  const playerOptions =
    players?.flatMap((item) =>
      item?.id === undefined
        ? []
        : [{ value: item.id, label: item.name ?? "未命名選手" }],
    ) ?? [];
  const playerStats = player
    ? calculatePlayerStats(player as unknown as Player)
    : undefined;
  const draftIsComplete = Boolean(
    selectedEnd?.round_scores?.length &&
      selectedEnd.round_scores.every((score) => (score.score ?? -1) >= 0),
  );
  const isSaving = isSavingScores || isConfirming;

  const discardDraft = () => {
    if (!dirty || window.confirm("要放棄這份未儲存草稿嗎？")) {
      setSelectedEnd(null);
      setDirty(false);
      setScoreDialogOpen(false);
      setError(null);
      return true;
    }
    return false;
  };

  const selectPlayer = (next: { label: string; value: number } | null) => {
    if (dirty && !discardDraft()) return;
    setSelectedPlayer(next);
    setSelectedEnd(null);
    setDirty(false);
    setError(null);
  };

  const openScoreDialog = (end: DatabaseRoundEnd) => {
    if (dirty && selectedEnd?.id !== end.id) {
      setError("請先送出或放棄目前草稿後再編輯其他波次。");
      return;
    }
    if (!dirty || selectedEnd?.id !== end.id) {
      setSelectedEnd(cloneEnd(end));
      setDirty(false);
    }
    setError(null);
    setScoreDialogOpen(true);
  };

  const addScore = (score: number) => {
    setSelectedEnd((end) => {
      const emptyIndex = end?.round_scores?.findIndex(
        (roundScore) => (roundScore.score ?? -1) === -1,
      ) ?? -1;
      if (!end || emptyIndex < 0) return end;
      setDirty(true);
      return {
        ...end,
        round_scores: end.round_scores?.map((roundScore, index) =>
          index === emptyIndex ? { ...roundScore, score } : roundScore,
        ),
      };
    });
  };

  const deleteScore = () => {
    setSelectedEnd((end) => {
      const lastFilledIndex = end?.round_scores?.reduce(
        (last, roundScore, index) =>
          (roundScore.score ?? -1) >= 0 ? index : last,
        -1,
      ) ?? -1;
      if (!end || lastFilledIndex < 0) return end;
      setDirty(true);
      return {
        ...end,
        round_scores: end.round_scores?.map((roundScore, index) =>
          index === lastFilledIndex ? { ...roundScore, score: -1 } : roundScore,
        ),
      };
    });
  };

  const endRows =
    player?.rounds?.flatMap((round, roundIndex) => {
      const ends = round.round_ends ?? [];
      const roundStats = playerStats?.rounds[roundIndex];
      return ends.flatMap((end, endIndex) => {
        const isLastEnd = endIndex === ends.length - 1;
        return [
          <Fragment key={end.id ?? `${roundIndex}-${endIndex}`}>
            <TableRow>
              <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1 }, py: 0.75 }}>
                {`${roundIndex + 1}-${endIndex + 1}`}
              </TableCell>
              <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1 }, py: 0.75 }}>
                <Box
                  data-testid={`qualification-end-scores-${end.id}`}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    // 一波箭分必須視為同一列；手機以較小方塊及分數欄寬保留六箭。
                    flexWrap: "nowrap",
                    gap: { xs: 0.25, sm: 0.5 },
                    minWidth: 0,
                  }}
                >
                  {end.round_scores?.map((score, scoreIndex) =>
                    <QualificationScoreSlot
                      key={score.id ?? scoreIndex}
                      score={score.score}
                    />,
                  )}
                </Box>
              </TableCell>
              <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1 }, py: 0.75 }}>
                {endTotal(end)}
              </TableCell>
              <TableCell align="center" sx={{ px: { xs: 0.25, sm: 0.5 }, py: 0.25 }}>
                <IconButton
                  aria-label={`編輯第${roundIndex + 1}局第${endIndex + 1}波分數`}
                  onClick={() => openScoreDialog(end)}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
            {isLastEnd && (
              <TableRow>
                <TableCell colSpan={4} sx={{ px: { xs: 0.75, sm: 1 }, py: 0.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "stretch", sm: "center" },
                      justifyContent: "space-between",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: { xs: 0.25, sm: 1 },
                      minWidth: 0,
                    }}
                  >
                    <Typography variant="body2">第 {roundIndex + 1} 局小計</Typography>
                    <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
                      <StatisticRow
                        totalXs={roundStats?.totalXs ?? 0}
                        totalTens={roundStats?.totalTens ?? 0}
                        totalScore={roundStats?.totalScore ?? 0}
                      />
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </Fragment>,
        ];
      });
    }) ?? [];

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 0.5, sm: 1 }, pb: 3, minWidth: 0 }}>
      <Card sx={{ p: { xs: 1, sm: 2 }, m: { xs: 1, sm: 2 } }}>
        <Autocomplete
          sx={{ width: { xs: "100%", sm: 200 } }}
          options={playerOptions}
          id="player-select"
          value={selectedPlayer}
          inputValue={inputValue}
          onChange={(_, next) => selectPlayer(next)}
          onInputChange={(_, next) => setInputValue(next)}
          renderInput={(params) => <TextField {...params} label="選手姓名" />}
        />
      </Card>

      <Box sx={{ mx: { xs: 1, sm: 2 }, minWidth: 0 }}>
        {error && !scoreDialogOpen && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <TableContainer component={Paper} sx={{ width: "100%", overflow: "hidden" }}>
          <Table data-testid="qualification-score-editor-table" size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: "14%", px: { xs: 0.5, sm: 1 } }}>局-波</TableCell>
                <TableCell align="center" sx={{ width: "62%", px: { xs: 0.5, sm: 1 } }}>分數</TableCell>
                <TableCell align="center" sx={{ width: "13%", px: { xs: 0.5, sm: 1 } }}>小計</TableCell>
                <TableCell align="center" sx={{ width: "11%", px: { xs: 0.5, sm: 1 } }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {endRows}
              {playerStats && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ px: { xs: 0.75, sm: 1 }, py: 0.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: { xs: "stretch", sm: "center" },
                        justifyContent: "space-between",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 0.25, sm: 1 },
                        minWidth: 0,
                      }}
                    >
                      <Typography variant="body2">全場總計</Typography>
                      <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
                        <StatisticRow
                          totalXs={playerStats.totalXs}
                          totalTens={playerStats.totalTens}
                          totalScore={playerStats.totalScore}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog
        open={scoreDialogOpen}
        onClose={() => !isSaving && setScoreDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { m: 1, width: "calc(100% - 16px)" } }}
      >
        <DialogTitle>編輯分數</DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Typography variant="body2">
              {selectedEnd?.is_confirmed ? "已確認（改分後維持確認）" : "未確認"}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {selectedEnd && !selectedEnd.is_confirmed && (dirty || !draftIsComplete) && (
              <Alert severity="info">請先送出完整箭分，再確認本波。</Alert>
            )}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "nowrap",
                gap: 0.5,
                minWidth: 0,
              }}
            >
              {selectedEnd?.round_scores?.map((score, index) =>
                <QualificationScoreSlot key={score.id ?? index} score={score.score} />,
              )}
            </Box>
            <ScoreController
              scores={(selectedEnd?.round_scores ?? []).map((score) => score.score ?? -1)}
              isConfirmed={selectedEnd?.is_confirmed ?? false}
              allowConfirmedEditing
              maximumArrowCount={selectedEnd?.round_scores?.length ?? 0}
              possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]}
              onAddScore={addScore}
              onDeleteScore={deleteScore}
              onSave={() => selectedEnd && saveScores(selectedEnd)}
              onConfirm={
                selectedEnd && !selectedEnd.is_confirmed && !dirty && draftIsComplete
                  ? () => selectedEnd.id && confirmEnd(selectedEnd.id)
                  : undefined
              }
              isSaving={isSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", px: { xs: 1, sm: 2 }, pb: 1 }}>
          <Button disabled={isSaving} onClick={() => setScoreDialogOpen(false)}>保留草稿並返回</Button>
          <Button color="warning" disabled={isSaving || !dirty} onClick={discardDraft}>放棄草稿</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
