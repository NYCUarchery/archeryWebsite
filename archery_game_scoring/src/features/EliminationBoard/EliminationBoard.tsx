import EliminationInfo from "../../jsons/EliminationInfo.json";
import PlayersBoard from "./SubBoards/PlayersBoard/PlayersBoard";
import StageBoard from "./SubBoards/StageBoard/StageBoard";
import ResultBoard from "./SubBoards/ResultBoard/ResultBoard";
import { useSelector } from "react-redux";

let groups = EliminationInfo.groups;

export default function EliminationBoard() {
  const groupShown = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  const group = groups[groupShown];
  const phaseShown = useSelector(
    (state: any) => state.phaseListButton.phaseShown
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);
  if (phaseShown !== 1) {
    return null;
  }

  let stageBoards = [];

  for (let i = 1; i <= stageNum; i++) {
    stageBoards.push(
      <StageBoard stageId={i} stage={group.stages[i - 1]}></StageBoard>
    );
  }

  return (
    <div className="elimination_board">
      <PlayersBoard players={group.players}></PlayersBoard>
      {stageBoards}
      <ResultBoard players={group.result.players}></ResultBoard>
    </div>
  );
}
