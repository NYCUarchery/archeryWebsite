import StageController from "./StageController/StageController";
import { useSelector } from "react-redux";

function BottomBar() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  return (
    <div className="bottom_bar">
      {boardShown === "score" ? <StageController /> : null}
    </div>
  );
}

export default BottomBar;
