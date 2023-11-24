import { Box } from "@mui/material";
import GroupsMenu from "../GroupsMenu/GroupsMenu";
import StageSetter from "./StageSetter";
import GroupBoard from "./GroupBoard/GroupBoard";
import SetCreator from "./SetCreator";
interface Props {
  teamSize: number;
  eliminationID: number;
}

export default function GroupEliminationBoard({
  teamSize,
  eliminationID,
}: Props) {
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
        <SetCreator
          teamSize={teamSize}
          eliminationID={eliminationID}
        ></SetCreator>
      </Box>
      <GroupBoard></GroupBoard>
    </Box>
  );
}
