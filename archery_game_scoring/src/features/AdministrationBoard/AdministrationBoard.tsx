import MainBoard from "./MainBoard/MainBoard";
import ScoreEditionBoard from "./ScoreEditionBoard/ScoreEditionBoard";
import ParticipantsBoard from "./ParticipantsBoard/ParticitpantsBoard";
import GroupsBoard from "./GroupsBoard/GroupsBoard";
import GameStructureBoard from "./GameStructureBoard/GameStructureBoard";
import ProcessBoard from "./ProcessBoard/ProcessBoard";
import { useSelector } from "react-redux";

export default function AdministrationBoard() {
  const adminBoardShown = useSelector(
    (state: any) => state.adminBoardTabs.adminBoardShown
  );
  const adminBoardTabs = useSelector(
    (state: any) => state.adminBoardTabs.adminBoardTabs
  );

  let board = specifyBoard(adminBoardTabs[adminBoardShown]);

  return <div className="administration_board">{board}</div>;
}

function specifyBoard(boardName: string) {
  let board;
  switch (boardName) {
    case "Main":
      board = <MainBoard></MainBoard>;
      break;
    case "Participants":
      board = <ParticipantsBoard></ParticipantsBoard>;
      break;
    case "Groups":
      board = <GroupsBoard></GroupsBoard>;
      break;
    case "Game Structure":
      board = <GameStructureBoard></GameStructureBoard>;
      break;
    case "Process":
      board = <ProcessBoard></ProcessBoard>;
      break;
    case "Score Edition":
      board = <ScoreEditionBoard></ScoreEditionBoard>;
      break;
  }

  return board;
}
