import { Button, ListItem } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";
import { useSelector } from "react-redux";

const putPlayerGroupID = ({ player, groupID }: any) => {
  return axios.put(`/api/player/group/${player.id}`, {
    group_id: groupID,
  });
};

interface Props {
  player: any;
}

export default function PlayerItem({ player }: Props) {
  const queryClient = useQueryClient();
  const selectedGroupID = useSelector(
    (state: any) => state.groupSelector.selectedGroupID
  );

  const { mutate } = useMutation(putPlayerGroupID, {
    onSuccess: () => {
      queryClient.invalidateQueries("groupsWithPlayers");
    },
  });

  const handOnClick = () => {
    if (!selectedGroupID) {
      return;
    }
    mutate({ player, groupID: selectedGroupID });
  };

  return (
    <ListItem sx={{ width: "100%" }}>
      <Button
        className="player_item"
        sx={{ width: "100%" }}
        onClick={handOnClick}
      >
        Name: {player.name},
        <br />
        Player ID: {player.id}
      </Button>
    </ListItem>
  );
}
