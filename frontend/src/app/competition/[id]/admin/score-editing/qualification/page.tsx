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
  DialogActions,
  Button,
} from "@mui/material";
import { useState } from "react";
import CircleSign from "@/components/CircleSign";
import { useScoreColor } from "@/utils/useScoreColor";
import ScoreController from "@/components/ScoreController/ScoreController";
import { DatabaseRoundEnd } from "@/types/Api";
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
          return (
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
                    const scoreColor = useScoreColor(score!.score!);
                    return (
                      <CircleSign
                        backgroundColor={scoreColor.backgroundColor}
                        color={scoreColor.textColor}
                        diameter={20}
                        text={score!.score!.toString()}
                      />
                    );
                  })}
                </Box>
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <IconButton onClick={() => handleOpenScoreDialog(end)}>
                  <EditIcon />
                </IconButton>
              </TableCell>
            </TableRow>
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
                const { textColor, backgroundColor } = useScoreColor(
                  score.score!
                );
                let text = score.score!.toString();

                if (score.score === 0) text = "M";
                else if (score.score === 11) text = "X";
                else if (score.score === -1) text = " ";
                return (
                  <CircleSign
                    text={text}
                    backgroundColor={backgroundColor}
                    color={textColor}
                    diameter={30}
                  ></CircleSign>
                );
              })
            ) : (
              <></>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ width: "100%" }}>
          <ScoreController
            selectedEnd={selectedEnd!}
            possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]}
            onAddScore={onAddscore}
            onDeleteScore={onDeleteScore}
            onSendScore={handleSaveScores}
          />
        </Box>
        <Button onClick={handleCloseScoreDialog} color="error">
          取消
        </Button>
      </Dialog>
    </Box>
  );
}
