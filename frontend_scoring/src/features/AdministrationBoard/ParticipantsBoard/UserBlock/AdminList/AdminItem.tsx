import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { deleteAdmin } from "../../ParticipantsSlice";

interface Props {
  id: number;
  name: string;
  index: number;
}

export default function AdminItem({ id, name, index }: Props) {
  const dispatch = useDispatch();
  const userId = useSelector((state: any) => state.user.userId);
  const hostId = useSelector((state: any) => state.game.hostId);
  let deleteButtonTag;

  switch (id) {
    case userId:
      deleteButtonTag = <ListItemText>It's Your Self!!</ListItemText>;
      break;
    case hostId:
      deleteButtonTag = <ListItemText>It's The Host!!</ListItemText>;
      break;
    default:
      deleteButtonTag = (
        <ListItemButton
          className="admin_item_delete_button"
          onClick={() => dispatch(deleteAdmin(index))}
        >
          ✕
        </ListItemButton>
      );
  }

  return (
    <ListItem key={id} className="admin_item">
      <ListItemText className="admin_item_text">
        ID: {id}
        <br />
        Name: {name}
      </ListItemText>
      {deleteButtonTag}
    </ListItem>
  );
}
