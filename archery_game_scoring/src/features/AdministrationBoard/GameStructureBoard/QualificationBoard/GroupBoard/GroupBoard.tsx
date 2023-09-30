import { Grid, Box } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import LanePlayerList from "./LanePlayerList/LanePlayerList";
import { useEffect } from "react";
import { setGroups } from "../../../GroupsBoard/groupsBoardSlice";
import NoLanePlayerList from "./NoLanePlayerList";

export default function GroupBoard() {
  const groupShown = useSelector(
    (state: any) => state.qualificationStructureGroupMenu.groupShown
  );
  const group = useSelector(
    (state: any) => state.groupsBoard.groups[groupShown]
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

  if (group.length === 0) return <div></div>;

  let lists = [];
  let noLanePlayers = [];
  let lanesplayers = create2DArray(endLane - startLane + 1, 0);
  for (let i = 0; i < group.length; i++) {
    if (
      group[i].lane === 0 ||
      group[i].lane - startLane >= endLane - startLane + 1 ||
      group[i].lane - startLane < 0
    ) {
      noLanePlayers.push(group[i]);
      continue;
    }
    lanesplayers[group[i].lane - startLane].push(group[i]);
  }

  for (let i = startLane; i <= endLane; i++) {
    lists.push(
      <Grid key={i} item xs={4}>
        <LanePlayerList
          laneNum={i}
          players={lanesplayers[i - startLane]}
        ></LanePlayerList>
      </Grid>
    );
  }

  return (
    <Box sx={{ width: "70%", display: "flex" }}>
      <NoLanePlayerList players={noLanePlayers}></NoLanePlayerList>
      <Grid container>{lists}</Grid>
    </Box>
  );
}

function create2DArray(rows: number, columns: number) {
  var x = new Array(rows);
  for (var i = 0; i < rows; i++) {
    x[i] = new Array(columns);
  }
  return x;
}
