import { Box, Divider, Grid } from "@mui/material";
import PlayerLight from "./PlayerLight";
import { useSelector } from "react-redux";
import useGetLaneWithPlayersScores from "../../../../../QueryHooks/useGetLaneWithPlayersScores";
import useGetCompetition from "../../../../../QueryHooks/useGetCompetition";
import { Player } from "../../../../../QueryHooks/types/Player";
interface Props {
  laneShell: any;
}

export default function LaneBlock({ laneShell }: Props) {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: lane } = useGetLaneWithPlayersScores(laneShell.id);
  const { data: competition } = useGetCompetition(competitionID);
  if (!lane || !competition) {
    return <></>;
  }
  const currentEnd: number = competition.qualification_current_end;
  const currentRound = Math.ceil(currentEnd / 6);

  let playerLights = [];
  if (currentRound !== 0 && currentRound <= competition.rounds_num) {
    for (let i = 0; i < lane.players.length; i++) {
      const player = lane.players[i] as Player;
      if (!player.rounds) break;
      const round = player.rounds[currentRound - 1];
      const endIndex = (currentEnd - 1) % 6;
      console.log(round);

      playerLights.push(
        <PlayerLight
          laneIndex={lane.lane_number}
          order={player.order}
          isConfirmed={round.round_ends[endIndex].is_confirmed}
          roundEndId={round.round_ends[endIndex].id}
          laneId={lane.id}
        ></PlayerLight>
      );
    }
  }

  return (
    <Grid
      item
      xs={2}
      sx={{
        border: "1px solid #d5d7dc",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "30px",
          fontSize: "15px",
          display: "flex",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Lane {lane.lane_number}
      </Box>
      <Divider />
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "30px",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        {playerLights}
      </Box>
    </Grid>
  );
}
