import { ListItem, ListItemText } from "@mui/material";
import { useDispatch } from "react-redux";
import { setSelectedPlayerId } from "../groupBoardSlice";

interface Props {
  id: number;
  name: string;
}

export default function PlayerItem({ id, name }: Props) {
  const dispatch = useDispatch();
  const handleClick = (_event: any) => {
    dispatch(setSelectedPlayerId(id));
  };

  return (
    <ListItem onClick={handleClick}>
      <ListItemText>
        Name: {name}
        <br />
        ID: {id}
      </ListItemText>
    </ListItem>
  );
}
