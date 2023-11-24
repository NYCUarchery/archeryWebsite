import { Box } from "@mui/material";
import GroupBoard from "./GroupBoard/GroupBoard";
import SetCreator from "./SetCreator";
import RankingButton from "./RankingButton";
interface Props {
  teamSize: number;
  eliminationID: number;
}

export default function GroupEliminationBoard({
  teamSize,
  eliminationID,
}: Props) {
  if (!eliminationID) return <></>;
  return (
    <Box
      className="group_elimination_board"
      sx={{
        display: "flex",
      }}
    >
      <Box>
        <SetCreator
          teamSize={teamSize}
          eliminationID={eliminationID}
        ></SetCreator>
        <RankingButton eliminationID={eliminationID}></RankingButton>
      </Box>
      <GroupBoard eliminationID={eliminationID}></GroupBoard>
    </Box>
  );
}
