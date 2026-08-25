"use client";
import { apiClient } from "@/utils/ApiClient";
import useGetCompetitionPlayers from "@/utils/QueryHooks/useGetCompetitionPlayers";
import { useMutation, useQuery, useQueryClient } from "react-query";
import EditIcon from "@mui/icons-material/Edit";
import {
  IconButton,
  useMediaQuery,
  Autocomplete,
  Box,
  Card,
  TableContainer,
  TextField,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  DialogTitle,
  Dialog,
  DialogContent,
  Button,
  Typography,
} from "@mui/material";
import { Fragment, useState } from "react";
import ScoreController from "@/components/ScoreController/ScoreController";
import { extractScores } from "@/components/ScoreController/util";
import { DatabaseRoundEnd } from "@/types/Api";
import ScoreBlock from "@/components/ScoreBlock";
import { calculatePlayerStats } from "@/utils/calculatePlayerStatistics";
import StatisticRow from "@/components/ScoreDetail/StatisticRow";
import { Player } from "@/types/oldRef/Player";

function createEndDraft(end: DatabaseRoundEnd): DatabaseRoundEnd {
  return {
    ...end,
    // ScoreController treats confirmed ends as read-only. This is an admin
    // editing draft, so clear it only in local state, never in query cache.
    is_confirmed: undefined,
    round_scores: end.round_scores?.map((roundScore) => ({ ...roundScore })),
  };
}

export default function Page({ params }: { params: { id: string } }) {
  const isSmall = useMediaQuery("(max-width:420px)");
  const queryClient = useQueryClient();
  const [selectedPlayer, setSelectedPlayer] = useState<{
    label: string | undefined;
    value: number | undefined;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedEnd, setSelectedEnd] = useState<DatabaseRoundEnd | null>(null);
  const competitionId = params.id;
  const { data: players } = useGetCompetitionPlayers(parseInt(competitionId));
  const { data: player } = useQuery(
    ["player", selectedPlayer?.value],
    () => apiClient.player.scoresDetail(selectedPlayer!.value!),
    {
      select: (data) => data.data,
      enabled: !!selectedPlayer?.value,
    }
  );
  const { mutate: updateScore, isLoading: isSavingScore } = useMutation(
    ({ endId, scores }: { endId: number; scores: { scores: number[] } }) =>
      apiClient.player.allEndscoresPartialUpdate(endId, scores),
    {
      onSuccess: async () => {
        const playerQueryKey = ["player", selectedPlayer?.value];
        await queryClient.invalidateQueries(playerQueryKey);
        setSelectedEnd(null);
        setScoreDialogOpen(false);
      },
    }
  );

  const playerOptions =
    players?.map((player) => ({
      value: player!.id,
      label: player!.name,
    })) ?? [];

  const handleOpenScoreDialog = (end: DatabaseRoundEnd) => {
    setSelectedEnd(createEndDraft(end));
    setScoreDialogOpen(true);
  };
  const handleSaveScores = () => {
    if (!selectedEnd?.id || !selectedEnd.round_scores || isSavingScore) return;
    const scores = selectedEnd!.round_scores!.map((score) => score.score!);
    updateScore({
      endId: selectedEnd!.id!,
      scores: { scores: scores },
    });
  };
  const handleCloseScoreDialog = () => {
    if (isSavingScore) return;
    setSelectedEnd(null);
    setScoreDialogOpen(false);
  };

  const onAddscore = (score: number) => {
    setSelectedEnd((end) => {
      if (!end?.round_scores) return end;
      const emptyIndex = end.round_scores.findIndex(
        (roundScore) => roundScore.score === -1
      );
      if (emptyIndex === -1) return end;
      return {
        ...end,
        round_scores: end.round_scores.map((roundScore, index) =>
          index === emptyIndex ? { ...roundScore, score } : roundScore
        ),
      };
    });
  };
  const onDeleteScore = () => {
    setSelectedEnd((end) => {
      if (!end?.round_scores) return end;
      const firstEmptyIndex = end.round_scores.findIndex(
        (roundScore) => roundScore.score === -1
      );
      const lastFilledIndex =
        firstEmptyIndex === -1
          ? end.round_scores.length - 1
          : firstEmptyIndex - 1;
      if (lastFilledIndex < 0) return end;
      return {
        ...end,
        round_scores: end.round_scores.map((roundScore, index) =>
          index === lastFilledIndex ? { ...roundScore, score: -1 } : roundScore
        ),
      };
    });
  };
  const playerStats = player
    ? calculatePlayerStats(player as unknown as Player)
    : undefined;
  const endRows =
    player?.rounds?.flatMap((round, roundIndex) => {
      const ends = round?.round_ends ?? [];
      const roundStats = playerStats?.rounds[roundIndex];
      return ends.map((end, endIndex) => {
        const isLastEnd = endIndex === ends.length - 1;
        const endTotal = end.round_scores?.reduce((total, score) => {
          if (score.score === 11) return total + 10;
          return score.score === -1 || score.score === undefined
            ? total
            : total + score.score;
        }, 0);
        return (
          <Fragment key={`${roundIndex}-${endIndex}`}>
            <TableRow key={`${roundIndex}-${endIndex}`}>
              <TableCell align="center" colSpan={1}>{`${roundIndex + 1}-${
                endIndex + 1
              }`}</TableCell>
              <TableCell align="center" colSpan={isSmall ? 3 : 6}>
                <Box
                  sx={{ display: "flex", justifyContent: "space-around" }}
                  key={`${roundIndex}-${endIndex}`}
                >
                  {end!.round_scores!.map((score) => {
                    return <ScoreBlock key={score.id} score={score.score!} />;
                  })}
                </Box>
              </TableCell>
              <TableCell align="center" colSpan={1}>
                {endTotal}
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <IconButton
                  aria-label={`編輯第${roundIndex + 1}局第${endIndex + 1}波分數`}
                  onClick={() => handleOpenScoreDialog(end)}
                >
                  <EditIcon />
                </IconButton>
              </TableCell>
            </TableRow>
            {isLastEnd && (
              <TableRow>
                <TableCell colSpan={isSmall ? 6 : 9}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography>{`第${roundIndex + 1}局小計`}</Typography>
                    <StatisticRow
                      totalXs={roundStats?.totalXs ?? 0}
                      totalTens={roundStats?.totalTens ?? 0}
                      totalScore={roundStats?.totalScore ?? 0}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        );
      });
    }) ?? [];

  return (
    <Box>
      <Card
        sx={{
          padding: 2,
          margin: 2,
        }}
      >
        <Autocomplete
          sx={{ width: "200px" }}
          options={playerOptions}
          id="player-select"
          value={selectedPlayer}
          inputValue={inputValue}
          onChange={(_, newValue) => {
            setSelectedPlayer(newValue);
          }}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          renderInput={(params) => <TextField {...params} label="選手姓名" />}
        ></Autocomplete>
      </Card>

      <Card
        sx={{
          padding: 2,
          margin: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            overflow: "visible",
            width: "auto",
          }}
        >
          <Table>
            <TableHead sx={{ width: "100%" }}>
              <TableRow sx={{}}>
                <TableCell align="center" colSpan={1}>
                  局-波
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={isSmall ? 3 : 6}
                  width={isSmall ? "auto" : "200px"}
                >
                  分數
                </TableCell>
                <TableCell align="center" colSpan={1}>
                  小計
                </TableCell>
                <TableCell align="center" colSpan={1}>
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {endRows}
              {playerStats && (
                <TableRow>
                  <TableCell colSpan={isSmall ? 6 : 9}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography>全場總計</Typography>
                      <StatisticRow
                        totalXs={playerStats.totalXs}
                        totalTens={playerStats.totalTens}
                        totalScore={playerStats.totalScore}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <Dialog open={scoreDialogOpen} onClose={handleCloseScoreDialog}>
        <DialogTitle>編輯分數</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              width: "250px",
            }}
          >
            {selectedEnd ? (
              selectedEnd!.round_scores!.map((score) => {
                return (
                  <ScoreBlock key={score.id} score={score.score!} />
                );
              })
            ) : (
              <></>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ width: "100%" }}>
          <ScoreController
            scores={extractScores(selectedEnd ?? undefined)}
            isConfirmed={selectedEnd?.is_confirmed ?? false}
            maximumArrowCount={selectedEnd?.round_scores?.length ?? 6}
            possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]}
            onAddScore={onAddscore}
            onDeleteScore={onDeleteScore}
            onSave={handleSaveScores}
            isSaving={isSavingScore}
          />
        </Box>
        <Button
          onClick={handleCloseScoreDialog}
          color="error"
          disabled={isSavingScore}
        >
          取消
        </Button>
      </Dialog>
    </Box>
  );
}
