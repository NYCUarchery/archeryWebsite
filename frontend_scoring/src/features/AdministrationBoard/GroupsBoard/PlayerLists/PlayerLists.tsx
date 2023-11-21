import PlayerList from "./PlayerList/PlayerList";

import { Box } from "@mui/material";

interface Props {
  groups: any[];
}

export default function PlayerLists({ groups }: Props) {
  let playerLists = [];

  for (let i = 0; i < groups.length; i++) {
    playerLists.push(<PlayerList key={i} players={groups[i].players} />);
  }

  return (
    <Box className="player_lists" sx={{ height: "450px" }}>
      {playerLists}
    </Box>
  );
}
