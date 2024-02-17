import { ListItem, ListItemText } from "@mui/material";
import { useMutation } from "react-query";

import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useQueryClient } from "react-query";
import { setSelectedPlayerId } from "../groupBoardSlice";

const putPlayerLaneID = ({ playerID, laneID }: any) => {
  return axios.put(`/api/player/lane/${playerID}`, { lane_id: laneID });
};

const putPlayerOrder = ({ playerID, order }: any) => {
  return axios.put(`/api/player/order/${playerID}`, { order: order });
};

interface Props {
  order: number;
  laneID: number;
}

export default function PlayerSlot({ order, laneID }: Props) {
  const dispatch = useDispatch();
  const selectedPlayerId = useSelector(
    (state: any) => state.qualificationStructureGroupBoard.selectedPlayerId
  );
  const queryClient = useQueryClient();
  const { mutate: setPlayerLaneID, isSuccess: isLaneIDSet } =
    useMutation(putPlayerLaneID);
  const { mutate: setPlayerOrder, isSuccess: isOrderSet } =
    useMutation(putPlayerOrder);
  const handleClick = (_event: any) => {
    setPlayerLaneID({ playerID: selectedPlayerId, laneID: laneID });
    setPlayerOrder({ playerID: selectedPlayerId, order: order });
    dispatch(setSelectedPlayerId(null));
  };

  if (isLaneIDSet && isOrderSet) {
    queryClient.invalidateQueries("qualificationWithLanesPlayers");
    queryClient.invalidateQueries("groupsWithPlayers");
  }
  return (
    <ListItem onClick={handleClick} sx={{ justifyContent: "center" }}>
      <ListItemText
        sx={{
          fontSize: "40px",
          color: "#2056cc",
          height: "70px",
          fontWeight: "bold",
        }}
      >
        {numberToAlphatbet(order)}
      </ListItemText>
    </ListItem>
  );
}

function numberToAlphatbet(value: number) {
  return String.fromCharCode(64 + value);
}
