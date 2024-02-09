import { useSelector } from "react-redux/es/hooks/useSelector";
import QualificationInfo from "../../jsons/QualificationInfo.json";
import EliminationInfo from "../../jsons/EliminationInfo.json";
import TeamEliminationInfo from "../../jsons/TeamEliminationInfo.json";
import QualificationBoard from "./QualifyingPhaseBoard/QualificationBoard";
import EliminationBoard from "./EliminationBoard/EliminationBoard";
import useGetGroupsWithPlayers from "../../QueryHooks/useGetGroupsWithPlayers";

const gameInfos = [
  QualificationInfo,
  EliminationInfo,
  TeamEliminationInfo,
  TeamEliminationInfo,
  TeamEliminationInfo,
];

export default function ScoreBoard() {
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);
  const phaseShown = useSelector((state: any) => state.phaseMenu.phaseShown);
  const phaseKindShown = useSelector(
    (state: any) => state.phaseMenu.phaseKindShown
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups } = useGetGroupsWithPlayers(competitionID);

  if (!groups) return <></>;
  if (boardShown !== "score") {
    return null;
  }

  const gameInfo = gameInfos[phaseShown];
  let board: any;

  switch (phaseKindShown) {
    case "Qualification":
      board = <QualificationBoard groups={groups}></QualificationBoard>;
      break;
    case "Elimination":
      board = <EliminationBoard gameInfo={gameInfo}></EliminationBoard>;
  }

  return <div className="score_board">{board}</div>;
}
