import { useDispatch } from "react-redux";
import { switchBoard } from "./boardSwitchSlice";
import { useSelector } from "react-redux";

export default function BoardSwitch() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  const dispatch = useDispatch();
  let content: string = "";

  switch (boardShown) {
    case "score":
      content = "榜";
      break;
    case "recording":
      content = "錄";
      break;
    case "administration":
      content = "監";
      break;
  }

  return (
    <button className="board_switch" onClick={() => dispatch(switchBoard())}>
      {content}
    </button>
  );
}
