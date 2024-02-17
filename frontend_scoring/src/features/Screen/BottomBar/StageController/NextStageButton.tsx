import { useDispatch } from "react-redux";
import { nextStage } from "./stageControllerSlice";

export default function NextStageButton() {
  const dispatch = useDispatch();
  return (
    <button className="next_stage_button" onClick={() => dispatch(nextStage())}>
      &gt;
    </button>
  );
}
