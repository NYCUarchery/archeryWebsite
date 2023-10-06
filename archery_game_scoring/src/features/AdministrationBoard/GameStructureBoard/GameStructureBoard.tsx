import SubboardController from "./SubboardController/SubboardController";
import { useSelector } from "react-redux";
import ActivationBoard from "./ActivationBoard/ActivationBoard";
import QualifcationBoard from "./QualificationBoard/QualificationBoard";
import EliminationBoard from "./EliminationBoard";
import GroupEliminationBoard from "./GroupEliminationBoard";
import MixedEliminationBoard from "./MixedEliminationBoard";

export default function GameStructureBoard() {
  const subboardShown = useSelector(
    (state: any) => state.gameStructureBoard.subboardShown
  );
  const subboardNames = useSelector(
    (state: any) => state.gameStructureBoard.subboardNames
  );

  let board = getSubboard(subboardShown, subboardNames);

  return (
    <div className="game_structure_board">
      <SubboardController></SubboardController>
      {board}
    </div>
  );
}

function getSubboard(subboardShown: number, subboardNames: string[]) {
  let board;
  switch (subboardNames[subboardShown]) {
    case subboardNames[0]:
      board = <ActivationBoard></ActivationBoard>;
      break;
    case subboardNames[1]:
      board = <QualifcationBoard></QualifcationBoard>;
      break;
    case subboardNames[2]:
      board = <EliminationBoard></EliminationBoard>;
      break;
    case subboardNames[3]:
      board = <GroupEliminationBoard></GroupEliminationBoard>;
      break;
    case subboardNames[4]:
      board = <MixedEliminationBoard></MixedEliminationBoard>;
      break;
  }
  return board;
}
