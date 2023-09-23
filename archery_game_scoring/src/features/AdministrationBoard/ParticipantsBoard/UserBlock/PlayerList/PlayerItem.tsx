import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useDispatch } from "react-redux";
import { deletePlayer } from "../../ParticipantsSlice";

interface Props {
  id: number;
  name: string;
  index: number;
}

export default function PlayerItem({ id, name, index }: Props) {
  const dispatch = useDispatch();
  return (
    <ListItem key={id} className="player_item">
      <ListItemText className="player_item_text">
        ID: {id}
        <br />
        Name: {name}
      </ListItemText>
      <ListItemButton
        className="player_item_delete_button"
        onClick={() => dispatch(deletePlayer(index))}
      >
        ✕
      </ListItemButton>
    </ListItem>
  );
}
