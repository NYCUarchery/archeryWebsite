import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useDispatch } from "react-redux";
import { confirmAdmin, deleteAdminsApplication } from "../../ParticipantsSlice";

interface Props {
  id: number;
  name: string;
  index: number;
}

export default function AdminItem({ id, name, index }: Props) {
  const dispatch = useDispatch();
  return (
    <ListItem key={id} className="admin_item">
      <ListItemText className="admin_item_text">
        ID: {id}
        <br />
        Name: {name}
      </ListItemText>
      <ListItemButton
        className="admin_item_confirm_button"
        onClick={() => dispatch(confirmAdmin(index))}
      >
        ✓
      </ListItemButton>
      <ListItemButton
        className="admin_item_delete_button"
        onClick={() => dispatch(deleteAdminsApplication(index))}
      >
        ✕
      </ListItemButton>
    </ListItem>
  );
}
