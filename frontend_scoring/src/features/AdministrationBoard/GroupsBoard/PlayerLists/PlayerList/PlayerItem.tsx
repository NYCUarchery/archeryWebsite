import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { movePlayer } from "../../groupsBoardSlice";

interface Props {
  name: string;
  id: number;
  index: number;
  groupId: number;
}

export default function PlayerItem({ name, id, index, groupId }: Props) {
  const dispatch = useDispatch();
  const selectedGroupId = useSelector(
    (state: any) => state.groupSelector.selectedGroupId
  );

  return (
    <Button
      className="player_item"
      onClick={() => dispatch(movePlayer({ index, groupId, selectedGroupId }))}
    >
      Name: {name}
      <br />
      ID: {id}
    </Button>
  );
}
