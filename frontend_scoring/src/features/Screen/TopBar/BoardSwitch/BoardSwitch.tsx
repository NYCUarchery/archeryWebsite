import { useDispatch } from "react-redux";
import { initBoardSwitch, switchBoard } from "./boardSwitchSlice";
import { useSelector } from "react-redux";

export default function BoardSwitch() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  const userStatus = useSelector((state: any) => state.user.userStatus);
  const userRole = useSelector((state: any) => state.user.userRole);
  const dispatch = useDispatch();
  dispatch(initBoardSwitch({ role: userRole, status: userStatus }));
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
