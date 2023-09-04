import { ListItem, ListItemText } from "@mui/material";

interface Props {
  name: string;
  id: number;
}

export default function PlayerItem({ name, id }: Props) {
  return (
    <ListItem className="player_item">
      <ListItemText>
        Name: {name}
        <br />
        ID: {id}
      </ListItemText>
    </ListItem>
  );
}
