import { ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";
import { Participant } from "../../participantInteface";

interface Props {
  participant: Participant;
}

const deleteParticipant = (participant: Participant) => {
  return axios.delete(`/api/participant/${participant.id}`);
};

export default function PlayerItem({ participant }: Props) {
  const queryClient = useQueryClient();
  const { mutate: removePlayer } = useMutation(deleteParticipant, {
    onSuccess: () => queryClient.invalidateQueries("participants"),
  });
  return (
    <ListItem key={participant.userID} className="player_item">
      <ListItemText className="player_item_text">
        ID: {participant.userID}
        <br />
        Name: {participant.name}
      </ListItemText>
      <ListItemButton
        className="player_item_delete_button"
        onClick={() => removePlayer(participant)}
      >
        ✕
      </ListItemButton>
    </ListItem>
  );
}
