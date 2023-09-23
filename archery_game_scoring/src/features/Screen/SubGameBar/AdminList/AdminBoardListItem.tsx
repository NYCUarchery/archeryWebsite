import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { selectAdminBoard } from "./adminBoardListSlice";

interface Props {
  content: string;
  index: number;
}

export default function AdminBoardListItem({ content, index }: Props) {
  const dispatch = useDispatch();

  return (
    <Button
      className="admin_board_list_item"
      onClick={() => dispatch(selectAdminBoard(index))}
    >
      {content}
    </Button>
  );
}
