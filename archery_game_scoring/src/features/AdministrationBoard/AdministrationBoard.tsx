import MainBoard from "./MainBoard/MainBoard";
import ScoreEditionBoard from "./ScoreEditionBoard/ScoreEditionBoard";
import ParticipantsBoard from "./ParticipantsBoard/ParticitpantsBoard";
import GroupsBoard from "./GroupsBoard/GroupsBoard";
import GameStructureBoard from "./GameStructureBoard/GameStructureBoard";
import PhasesBoard from "./PhasesBoard/PhasesBoard";
import { useSelector } from "react-redux";

export default function AdministrationBoard() {
  const adminBoardShown = useSelector(
    (state: any) => state.adminBoardList.adminBoardShown
  );
  const adminBoardList = useSelector(
    (state: any) => state.adminBoardList.adminBoardList
  );

  let board = specifyBoard(adminBoardList[adminBoardShown]);

  return <div className="administration_board">{board}</div>;
}

function specifyBoard(boardName: string) {
  let board;
  switch (boardName) {
    case "main":
      board = <MainBoard></MainBoard>;
      break;
    case "participants":
      board = <ParticipantsBoard></ParticipantsBoard>;
      break;
    case "groups":
      board = <GroupsBoard></GroupsBoard>;
      break;
    case "gameStructure":
      board = <GameStructureBoard></GameStructureBoard>;
      break;
    case "phases":
      board = <PhasesBoard></PhasesBoard>;
      break;
    case "scoreEdition":
      board = <ScoreEditionBoard></ScoreEditionBoard>;
      break;
  }

  return board;
}
