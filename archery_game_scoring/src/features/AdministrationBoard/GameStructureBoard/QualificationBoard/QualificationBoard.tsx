import ArrowsNumPerEndSetter from "./ArrowsNumPerEndSetter";
import EndsSetter from "./EndsSetter";
import GroupBoard from "./GroupBoard/GroupBoard";
import GroupsMenu from "./GroupsMenu/GroupsMenu";
import LanesSetter from "./LanesSetter";
import PlayersNumPerLaneSetter from "./PlayersNumPerLaneSetter";
import RoundSetter from "./RoundsSetter";
import { Box } from "@mui/material";

export default function QualifcationBoard() {
  return (
    <Box
      sx={{
        display: "flex",
      }}
      className="qualification_board"
    >
      <Box sx={{ marginRight: "40px" }}>
        <GroupsMenu />
        <RoundSetter />
        <EndsSetter />
        <ArrowsNumPerEndSetter />
        <LanesSetter />
        <PlayersNumPerLaneSetter />
      </Box>
      <GroupBoard></GroupBoard>
    </Box>
  );
}
