import { Box, Divider, Grid } from "@mui/material";
import PlayerLight from "./PlayerLight";
import { useSelector } from "react-redux";
import useGetLaneWithPlayersScores from "../../../../../QueryHooks/useGetLaneWithPlayersScores";
import useGetCompetition from "../../../../../QueryHooks/useGetCompetition";
interface Props {
  laneShell: any;
}

export default function LaneBlock({ laneShell }: Props) {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: lane, isLoading: isLoadingLane } = useGetLaneWithPlayersScores(
    laneShell.id
  );
  const { data: competition, isLoading: isLoadingCompetition } =
    useGetCompetition(competitionID);
  if (isLoadingLane || isLoadingCompetition) {
    return <></>;
  }
  const currentEnd: number = competition.qualification_current_end;
  const currentRound = Math.ceil(currentEnd / 6);

  let playerLights = [];
  if (currentRound !== 0 && currentRound <= competition.rounds_num) {
    for (let i = 0; i < lane.players.length; i++) {
      const player = lane.players[i];
      const round = player.rounds[currentRound - 1];
      const endIndex = (currentEnd - 1) % 6;
      console.log(round);

      playerLights.push(
        <PlayerLight
          laneIndex={lane?.lane_number}
          order={player.order}
          isConfirmed={round.round_ends[endIndex].is_confirmed}
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
