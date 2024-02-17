import GroupBoard from "./GroupBoard/GroupBoard";
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
        <QualificationStructureSetter></QualificationStructureSetter>
      </Box>
      <GroupBoard></GroupBoard>
    </Box>
  );
}
