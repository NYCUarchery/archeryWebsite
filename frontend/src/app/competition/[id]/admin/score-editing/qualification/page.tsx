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
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  DialogTitle,
  Dialog,
  DialogContent,
  Button,
} from "@mui/material";
import { useState } from "react";
import ScoreController from "@/components/ScoreController/ScoreController";
import { extractScores } from "@/components/ScoreController/util";
import { DatabaseRoundEnd } from "@/types/Api";
import ScoreCircle from "@/components/ScoreCircle";

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
  const { mutate: updateScore } = useMutation(
    ({ endId, scores }: { endId: number; scores: { scores: number[] } }) =>
      apiClient.player.allEndscoresPartialUpdate(endId, scores),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["player", selectedPlayer?.value]);
      },
    }
  );

  const playerOptions =
    players?.map((player) => ({
      value: player!.id,
      label: player!.name,
    })) ?? [];

  const handleOpenScoreDialog = (end: DatabaseRoundEnd) => {
    // The conponent disables editing if the end is confirmed
    end.is_confirmed = undefined;
    setSelectedEnd(end);
    setScoreDialogOpen(true);
  };
  const handleSaveScores = () => {
    const scores = selectedEnd!.round_scores!.map((score) => score.score!);
    updateScore({
      endId: selectedEnd!.id!,
      scores: { scores: scores },
    });
    setScoreDialogOpen(false);
  };
  const handleCloseScoreDialog = () => {
    queryClient.invalidateQueries(["player", selectedPlayer?.value]);
    setScoreDialogOpen(false);
  };

  const onAddscore = (score: number) => {
    const lastEmptyScore = selectedEnd!.round_scores!.find(
      (score) => score.score === -1
    );
    lastEmptyScore!.score = score;
    setSelectedEnd({ ...selectedEnd! });
  };
  const onDeleteScore = () => {
    const lastScore = selectedEnd!.round_scores!.findIndex(
      (score) => score.score === -1
    );
    if (lastScore === -1) {
      selectedEnd!.round_scores![selectedEnd!.round_scores!.length - 1].score =
        -1;
    } else {
      selectedEnd!.round_scores![lastScore - 1].score = -1;
    }
    setSelectedEnd({ ...selectedEnd! });
  };
  const endRows =
    player
      ?.rounds!.map((round, roundIndex) => {
        return round!.round_ends!.map((end, endIndex) => {
          let roundTotalRow = <></>;
          if (endIndex === 5) {
            roundTotalRow = (
              <TableRow key={`${roundIndex}-total`}>
                <TableCell align="center" colSpan={1}>{`${
                  roundIndex + 1
                }`}</TableCell>
                <TableCell align="center" colSpan={isSmall ? 3 : 6}></TableCell>
                <TableCell align="center" colSpan={1}>
                  {round.total_score}
                </TableCell>
                <TableCell align="center" colSpan={1}></TableCell>
              </TableRow>
            );
          }

          const endTotal = end!.round_scores!.reduce((acc, score) => {
            if (score.score === 11) {
              acc += 10;
            } else if (score.score !== -1) {
              acc += score.score!;
            }
            return acc;
          }, 0);
          return (
            <>
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
                      return (
                        <ScoreCircle
                          key={score.id}
                          score={score.score!}
                          diameter={25}
                        />
                      );
                    })}
                  </Box>
                </TableCell>
                <TableCell align="center" colSpan={1}>
                  {endTotal}
                </TableCell>
                <TableCell align="center" colSpan={1}>
                  <IconButton onClick={() => handleOpenScoreDialog(end)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              {roundTotalRow}
            </>
          );
        });
      })
      .flat() ?? [];

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
          <TableBody>{endRows}</TableBody>
        </TableContainer>
      </Card>
      <Dialog open={scoreDialogOpen}>
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
                  <ScoreCircle
                    key={score.id}
                    score={score.score!}
                    diameter={25}
                  />
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
          />
        </Box>
        <Button onClick={handleCloseScoreDialog} color="error">
          取消
        </Button>
      </Dialog>
    </Box>
  );
}
