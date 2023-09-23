import { useDispatch } from "react-redux";
import { lastStage } from "./stageControllerSlice";

export default function LastStageButton() {
  const dispatch = useDispatch();

  return (
    <button className="last_stage_button" onClick={() => dispatch(lastStage())}>
      {" "}
      &lt;
    </button>
  );
}
