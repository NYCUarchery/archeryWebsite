import { Grid, Box } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import LanePlayerList from "./LanePlayerList/LanePlayerList";
import { useEffect } from "react";
import { setGroups } from "../../../GroupsBoard/groupsBoardSlice";
import NoLanePlayerList from "./NoLanePlayerList";

export default function GroupBoard() {
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const group = useSelector(
    (state: any) =>
      state.gameStructureBoard.qualificationInfo.groups[groupShown]
  );
  const startLane = useSelector(
    (state: any) => state.game.qualification.groups[groupShown].start_lane
  );
  const endLane = useSelector(
    (state: any) => state.game.qualification.groups[groupShown].end_lane
  );
  const players = useSelector((state: any) => state.participants.players);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setGroups(players));
  }, []);

  let lists = [];

  for (let i = startLane; i <= endLane; i++) {
    lists.push(
      <Grid key={i} item xs={4}>
        <LanePlayerList
          laneNum={i}
          players={group.lanes[i - startLane].players}
        ></LanePlayerList>
      </Grid>
    );
  }

  return (
    <Box sx={{ width: "70%", display: "flex" }}>
      <NoLanePlayerList players={group.no_lane_players}></NoLanePlayerList>
      <Grid container>{lists}</Grid>
    </Box>
  );
}
