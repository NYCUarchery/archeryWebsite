import { Avatar } from "@mui/material";
import { useQueryClient, useMutation } from "react-query";
import axios from "axios";
const putIsConfirmed = ({ roundEndId, isConfirmed }: any) => {
  return axios.put(`/api/player/isconfirmed/${roundEndId}`, {
    is_confirmed: !isConfirmed,
  });
};
interface Props {
  laneIndex: number;
  order: number;
  isConfirmed: boolean;
  roundEndId: number;
  laneId: number;
}

export default function PlayerLight({
  laneIndex,
  order,
  isConfirmed,
  roundEndId,
  laneId,
}: Props) {
  let playerCode = laneIndex.toString();
  const queryClient = useQueryClient();

  const { mutate: toggleConfirmation } = useMutation(putIsConfirmed, {
    onSuccess: () => {
      queryClient.invalidateQueries(["laneWithPlayersScores", laneId]);
    },
  });

  playerCode += String.fromCharCode("A".charCodeAt(0) + order - 1);

  return (
    <Avatar
      sx={{
        width: "25px",
        height: "25px",
        fontSize: "12px",
        backgroundColor: isConfirmed ? "#1bdc1b" : "#dc1b1b",
        color: "white",
      }}
      onClick={() => {
        toggleConfirmation({
          roundEndId: roundEndId,
          isConfirmed: isConfirmed,
        });
      }}
    >
      {playerCode}
    </Avatar>
  );
}
