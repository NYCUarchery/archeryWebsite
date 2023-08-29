import MainBoard from "./MainBoard/MainBoard";
import ScoreEditionBoard from "./ScoreEditionBoard/ScoreEditionBoard";
import ParticipantsBoard from "./ParticipantsBoard/ParticitpantsBoard";
import { useSelector } from "react-redux";

export default function AdministrationBoard() {
  const adminBoardShown = useSelector(
    (state: any) => state.adminBoardList.adminBoardShown
  );
  const adminBoardList = useSelector(
    (state: any) => state.adminBoardList.adminBoardList
  );

  let board = <MainBoard></MainBoard>;

  switch (adminBoardList[adminBoardShown]) {
    case "main":
      board = <MainBoard></MainBoard>;
      break;
    case "score_edition":
      board = <ScoreEditionBoard></ScoreEditionBoard>;
      break;
    case "participants":
      board = <ParticipantsBoard></ParticipantsBoard>;
  }

  return <div className="administration_board">{board}</div>;
}
