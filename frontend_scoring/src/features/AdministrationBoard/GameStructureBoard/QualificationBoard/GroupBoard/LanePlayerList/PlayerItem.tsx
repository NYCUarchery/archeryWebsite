import { ListItem, ListItemText } from "@mui/material";
import { useDispatch } from "react-redux";
import { setSelectedPlayerId } from "../groupBoardSlice";
import { useSelector } from "react-redux";

interface Props {
  player: any;
  order: number;
}

export default function PlayerItem({ player }: Props) {
  const id = player?.id;
  const name = player?.name;
  const selectedPlayerId = useSelector(
    (state: any) => state.qualificationStructureGroupBoard.selectedPlayerId
  );
  const dispatch = useDispatch();

  const handleClick = (_event: any) => {
    if (selectedPlayerId === id) dispatch(setSelectedPlayerId(null));
    else dispatch(setSelectedPlayerId(id));
  };

  let isSelected = false;
  if (id === selectedPlayerId) isSelected = true;

  return (
    <ListItem
      onClick={handleClick}
      sx={{
        height: "70px",
        display: "flex",
        backgroundColor: isSelected ? "#d5d7dc" : "white",
      }}
    >
      <ListItemText>
        Name: {name}
        <br />
        Player ID: {id}
      </ListItemText>
    </ListItem>
  );
}
