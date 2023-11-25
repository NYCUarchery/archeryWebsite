import { Box } from "@mui/material";
import StageList from "./MatchBlock/StageList";

interface Props {
  stages: any;
}
export default function StagesBlock({ stages }: Props) {
  let stageLists = [];

  for (let i = 0; i < stages.length; i++) {
    stageLists.push(<StageList key={i} stage={stages[i]}></StageList>);
  }
  return <Box sx={{ display: "flex" }}>{stageLists}</Box>;
}
