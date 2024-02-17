import { List, ListItem, Box } from "@mui/material";
import MatchBlock from "./MatchBlock";
import MatchAddButton from "./MatchAddButton";

interface Props {
  stage: any;
}

export default function StageList({ stage }: Props) {
  let matches = [];

  for (let i = 0; i < stage.matchs.length; i++) {
    const match = stage.matchs[i];
    matches.push(
      <ListItem>
        <MatchBlock match={match}></MatchBlock>
      </ListItem>
    );
  }

  return (
    <Box sx={{ border: "1px solid #f4f4f4" }}>
      <MatchAddButton stage={stage}></MatchAddButton>
      <List>{matches}</List>
    </Box>
  );
}
