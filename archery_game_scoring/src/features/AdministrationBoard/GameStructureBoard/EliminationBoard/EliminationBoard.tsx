import { Box } from "@mui/material";
import GroupsMenu from "../GroupsMenu/GroupsMenu";
import StageSetter from "./StageSetter";
import GroupBoard from "./GroupBoard/GroupBoard";

export default function EliminationBoard() {
  return (
    <Box
      className="elimination_board"
      sx={{
        display: "flex",
      }}
    >
      <Box className="elimination_board">
        <GroupsMenu></GroupsMenu>
        <StageSetter></StageSetter>
      </Box>
      <GroupBoard></GroupBoard>
    </Box>
  );
}
