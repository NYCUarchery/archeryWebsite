import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import axios from "axios";
import { useMutation } from "react-query";
import { useQueryClient } from "react-query";

interface Props {
  participant: Participant;
}

interface Participant {
  id: number;
  userID: number;
  competitionID: number;
  role: string;
  status: string;
}
const putApprovedPlayer = (participant: Participant) => {
  const admin = {
    user_id: participant.userID,
    competition_id: participant.competitionID,
    role: participant.role,
    status: "approved",
  };

  return axios.put(`/api/participant/${participant.id}`, admin);
};
const deleteRejectedPlayer = (participant: Participant) => {
  return axios.put(`/api/participant/${participant.id}`);
};
const postPlayer = (participant: Participant) => {
  return axios.post(`/api/player/${participant.id}`);
};

export default function PlayerItem({ participant }: Props) {
  const queryClient = useQueryClient();
  const { mutate: approvedPlayer } = useMutation(putApprovedPlayer, {
    onSuccess: () => queryClient.invalidateQueries("participants"),
  });
  const { mutate: deletePlayer } = useMutation(deleteRejectedPlayer, {
    onSuccess: () => queryClient.invalidateQueries("participants"),
  });
  const { mutate: createPlayer } = useMutation(postPlayer);
  return (
    <ListItem key={participant.userID} className="player_item">
      <ListItemText className="player_item_text">
        ID: {participant.userID}
        <br />
        Name: {participant.userID}
      </ListItemText>
      <ListItemButton
        className="player_item_confirm_button"
        onClick={() => {
          approvedPlayer(participant);
          createPlayer(participant);
        }}
      >
        ✓
      </ListItemButton>
      <ListItemButton
        className="player_item_delete_button"
        onClick={() => deletePlayer(participant)}
      >
        ✕
      </ListItemButton>
    </ListItem>
  );
}
