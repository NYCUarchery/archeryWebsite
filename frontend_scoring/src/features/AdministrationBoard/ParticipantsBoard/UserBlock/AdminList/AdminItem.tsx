import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useSelector } from "react-redux";
import { useMutation } from "react-query";
import axios from "axios";
import { Participant } from "../../participantInteface";
import { useQueryClient } from "react-query";

interface Props {
  participant: Participant;
}

const deleteAdmin = (participant: Participant) => {
  return axios.delete(`/api/participant/${participant.id}`);
};

export default function AdminItem({ participant }: Props) {
  const queryClient = useQueryClient();
  const userId = useSelector((state: any) => state.user.userId);
  const hostId = useSelector((state: any) => state.game.hostId);
  const { mutate: removeAdmin } = useMutation(deleteAdmin, {
    onSuccess: () => queryClient.invalidateQueries("participants"),
  });

  let deleteButtonTag;

  switch (participant.userID) {
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
          onClick={() => removeAdmin(participant)}
        >
          ✕
        </ListItemButton>
      );
  }

  return (
    <ListItem key={participant.userID} className="admin_item">
      <ListItemText className="admin_item_text">
        ID: {participant.userID}
        <br />
        Name: {participant.name}
      </ListItemText>
      {deleteButtonTag}
    </ListItem>
  );
}
