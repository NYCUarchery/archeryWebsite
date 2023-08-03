import { useSelector } from "react-redux/es/hooks/useSelector";
import LaneBoard from "./LaneBoard/LaneBoard";
import LaneInfo from "../../jsons/LaneInfo.json";
import { selectStage } from "../Screen/BottomBar/StageController/stageControllerSlice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

export default function RecordingBoard() {
  const currentStage = useSelector((state: any) => state.game.currentStage);
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  const dispatch = useDispatch();
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  useEffect(() => {
    dispatch(selectStage(currentStage));
  }, [boardShown]);

  return (
    <div className="recording_board">
      <LaneBoard
        laneNum={LaneInfo.lane_num}
        userNames={LaneInfo.user_names}
        stageInfo={LaneInfo.stages[stageShown]}
      />
    </div>
  );
}
