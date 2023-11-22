import GroupBoard from "./GroupBoard/GroupBoard";
import GroupsMenu from "../GroupsMenu/GroupsMenu";
import { Box } from "@mui/material";
import QualificationStructureSetter from "./QualificationStructureSetter/QualificationStructureSetter";

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
        <QualificationStructureSetter></QualificationStructureSetter>
      </Box>
      <GroupBoard></GroupBoard>
    </Box>
  );
}
