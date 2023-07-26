import { useDispatch } from "react-redux";
import { switchBoard } from "./boardSwitchSlice";

export default function BoardSwitch() {
  const dispatch = useDispatch();
  return (
    <button className="board_switch" onClick={() => dispatch(switchBoard())}>
      ．
    </button>
  );
}
