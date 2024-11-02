import { Group } from "@/types/oldRef/Competition";
import { Box, Typography } from "@mui/material";

const phases = ["資格賽", "對抗賽", "團體對抗賽", "混雙對抗賽"];
interface Props {
  currentPhase?: number;
  playerGroup?: number;
  groups?: Group[];
}

export default function GroupPhaseTag({
  currentPhase = 0,
  playerGroup,
  groups = [],
}: Props) {
  const phase = phases[currentPhase];
  const groupName = groups.find(
    (group) => group.id === playerGroup
  )?.group_name;

  if (groups === undefined || phases === undefined) {
    return <></>;
  }

  return (
    <Box
      className="group_phase_tag"
      sx={{
        width: "400px",
        height: "100%",
        backgroundColor: "primary.dark",
        color: "primary.contrastText",
        display: "flex",
        textAlign: "center",
        alignItems: "center",
      }}
    >
      <Typography sx={{ width: "200px" }}>{groupName}</Typography>
      <Typography sx={{ width: "200px" }}>{phase}</Typography>
    </Box>
  );
}
