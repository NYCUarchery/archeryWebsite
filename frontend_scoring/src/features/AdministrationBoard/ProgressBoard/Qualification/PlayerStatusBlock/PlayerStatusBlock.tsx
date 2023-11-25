import { Grid } from "@mui/material";
import LaneBlock from "./LaneBlock";
import useGetLanes from "../../../../../QueryHooks/useGetLanes";
import { useSelector } from "react-redux";

export default function PlayerStatusBlock() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: lanes, isLoading: isLoadingLanes } = useGetLanes(competitionID);

  if (isLoadingLanes) {
    return <></>;
  }
  let items = [];
  for (let i = 1; i < lanes.length; i++) {
    items.push(<LaneBlock laneShell={lanes[i]}></LaneBlock>);
  }

  return (
    <Grid container spacing={0}>
      {items}
    </Grid>
  );
}
