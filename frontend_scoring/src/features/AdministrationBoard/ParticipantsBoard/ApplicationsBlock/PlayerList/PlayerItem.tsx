import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useDispatch } from "react-redux";
import {
  deletePlayerApplication,
  confirmPlayer,
} from "../../ParticipantsSlice";

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
        className="player_item_confirm_button"
        onClick={() => dispatch(confirmPlayer(index))}
      >
        ✓
      </ListItemButton>
      <ListItemButton
        className="player_item_delete_button"
        onClick={() => dispatch(deletePlayerApplication(index))}
      >
        ✕
      </ListItemButton>
    </ListItem>
  );
}
