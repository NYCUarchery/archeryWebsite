import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";
import { Participant } from "../../participantInteface";

interface Props {
  participant: Participant;
}

const putApprovedAdmin = (participant: Participant) => {
  const admin = {
    user_id: participant.userID,
    competition_id: participant.competitionID,
    role: participant.role,
    status: "approved",
  };

  return axios.put(`/api/participant/${participant.id}`, admin);
};

const deleteRejectedAdmin = (participant: Participant) => {
  return axios.delete(`/api/participant/${participant.id}`);
};

export default function AdminItem({ participant }: Props) {
  const queryClient = useQueryClient();
  const { mutate: approveAdmin } = useMutation(putApprovedAdmin, {
    onSuccess: () => queryClient.invalidateQueries("participants"),
  });
  const { mutate: deleteAdmin } = useMutation(deleteRejectedAdmin, {
    onSuccess: () => queryClient.invalidateQueries("participants"),
  });
  return (
    <ListItem key={participant.userID} className="admin_item">
      <ListItemText className="admin_item_text">
        ID: {participant.userID}
        <br />
        Name: {participant.name}
      </ListItemText>
      <ListItemButton
        className="admin_item_confirm_button"
        onClick={() => approveAdmin(participant)}
      >
        ✓
      </ListItemButton>
      <ListItemButton
        className="admin_item_delete_button"
        onClick={() => deleteAdmin(participant)}
      >
        ✕
      </ListItemButton>
    </ListItem>
  );
}
