import { useSelector } from "react-redux/es/hooks/useSelector";
import QualificationInfo from "../../jsons/QualificationInfo.json";
import EliminationInfo from "../../jsons/EliminationInfo.json";
import TeamEliminationInfo from "../../jsons/TeamEliminationInfo.json";
import QualificationBoard from "./QualifyingPhaseBoard/QualificationBoard";
import EliminationBoard from "./EliminationBoard/EliminationBoard";

const gameInfos = [QualificationInfo, EliminationInfo, TeamEliminationInfo];

export default function ScoreBoard() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  const phaseShown = useSelector(
    (state: any) => state.phaseListButton.phaseShown
  );

  if (boardShown !== "score") {
    return null;
  }

  const gameInfo = gameInfos[phaseShown];
  let board: any;

  switch (gameInfo.phase) {
    case "qualification":
      board = <QualificationBoard gameInfo={gameInfo}></QualificationBoard>;
      break;
    case "elimination":
      board = <EliminationBoard gameInfo={gameInfo}></EliminationBoard>;
  }

  return <div className="score_board">{board}</div>;
}
