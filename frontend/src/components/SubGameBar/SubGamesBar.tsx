import Box from "@mui/material/Box";

import GroupMenu from "./GroupMenu";
import PhaseMenu from "./PhaseMenu";
import GroupPhaseTag from "./GroupPhaseTag";
import { Group } from "@/types/oldRef/Competition";
import { useSelectedLayoutSegment } from "next/navigation";

interface Props {
  groups: Group[];
  isLoading: boolean;
}

function SubGamesBar({ groups, isLoading }: Props) {
  let content: any;
  const segment = useSelectedLayoutSegment();

  if (isLoading) return <></>;

  switch (segment) {
    case "scoreboard":
      content = (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <GroupMenu groups={groups as Group[]}></GroupMenu>
          <PhaseMenu />
        </Box>
      );
      break;
    case "scoring":
      content = <GroupPhaseTag></GroupPhaseTag>;
      break;
    case "admin":
      return <></>;
  }

  return (
    <Box
      sx={{
        backgroundColor: "primary.main",
        display: "flex",
        justifyContent: "center",
        height: "2rem",
      }}
    >
      {content}
    </Box>
  );
}

export default SubGamesBar;
