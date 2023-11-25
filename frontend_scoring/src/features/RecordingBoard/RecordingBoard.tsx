import LaneBoard from "./LaneBoard/LaneBoard";
import LaneInfo from "../../jsons/LaneInfo.json";
import { selectStage } from "../Screen/BottomBar/StageController/stageControllerSlice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

export default function RecordingBoard() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition, isLoading } = useGetCompetition(competitionID);
  if (isLoading) return <></>;
  const currentPhase = competition.current_phase;
  let content = <h1>怪怪的</h1>;

  if (currentPhase === 0) content = <h1>現在是賽前喔，啾</h1>;
  else if (currentPhase === 1) content = <LaneBoard></LaneBoard>;
  else if (currentPhase < 5) {
  }

  return (
    <div className="recording_board">
      <LaneBoard />
    </div>
  );
}
