"use client";
import { apiClient } from "@/utils/ApiClient";
import useGetCompetitionPlayers from "@/utils/QueryHooks/useGetCompetitionPlayers";
import { useQuery } from "react-query";
import {
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
} from "@mui/material";
import { useState } from "react";
import CircleSign from "@/components/CircleSign";
import { useScoreColor } from "@/utils/useScoreColor";
export default function Page({ params }: { params: { id: string } }) {
  const isSmall = useMediaQuery("(max-width:420px)");
  const [selectedPlayer, setSelectedPlayer] = useState<{
    label: string | undefined;
    value: number | undefined;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
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
  const playerOptions =
    players?.map((player) => ({
      value: player!.id,
      label: player!.name,
    })) ?? [];

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
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
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
                操作
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
    </Box>
  );
}
