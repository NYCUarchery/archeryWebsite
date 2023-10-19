import { Box } from "@mui/material";
import GroupsMenu from "../GroupsMenu/GroupsMenu";
import StageSetter from "./StageSetter";
import GroupBoard from "./GroupBoard/GroupBoard";

export default function GroupEliminationBoard() {
  return (
    <Box
      className="group_elimination_board"
      sx={{
        display: "flex",
      }}
    >
      <Box>
        <GroupsMenu></GroupsMenu>
        <StageSetter></StageSetter>
      </Box>
      <GroupBoard></GroupBoard>
    </Box>
  );
}
