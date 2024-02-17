import { Grid, Box } from "@mui/material";
import { useSelector } from "react-redux";
import LanePlayerList from "./LanePlayerList/LanePlayerList";
import NoLanePlayerList from "./NoLanePlayerList";
import useGetLanes from "../../../../../QueryHooks/useGetLanes";

export default function GroupBoard() {
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: lanes } = useGetLanes(competitionID);
  if (!lanes) {
    return <></>;
  }

  let lists = [];

  for (let i = 1; i < lanes.length; i++) {
    if (lanes[i].qualification_id !== groupShown) {
      continue;
    }

    const lane = lanes[i];
    lists.push(
      <Grid key={i} item xs={4}>
        <LanePlayerList
          laneNum={lane.lane_number}
          laneID={lane.id}
        ></LanePlayerList>
      </Grid>
    );
  }

  return (
    <Box sx={{ width: "70%", display: "flex" }}>
      <NoLanePlayerList></NoLanePlayerList>
      <Grid container>{lists}</Grid>
    </Box>
  );
}
