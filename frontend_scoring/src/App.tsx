import TopBar from "./features/Screen/TopBar/TopBar";
import "./style/App.scss";
import SubGamesBar from "./features/Screen/SubGameBar/SubGamesBar";
import BottomBar from "./features/Screen/BottomBar/BottomBar";
import ScoreBoard from "./features/ScoreBoard/ScoreBoard";
import RecordingBoard from "./features/RecordingBoard/RecordingBoard";
import AdministrationBoard from "./features/AdministrationBoard/AdministrationBoard";
import { useSelector } from "react-redux/es/hooks/useSelector";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { initialize } from "./features/States/gameSlice";
import useGetUserParticipant from "./QueryHooks/useGetUserParticipant";
import { initUserStatus } from "./features/States/userSlice";
import {
  initUserId,
  initUserName,
  initUserRole,
} from "./features/States/userSlice";
import { initBoardMenu } from "./features/Screen/TopBar/BoardMenu/boardMenuSlice";

function App() {
  const { competitionID } = useParams();
  const dispatch = useDispatch();
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);
  const { data: participant, isLoading } = useGetUserParticipant(
    Number(competitionID)
  );
  let board: any;

  if (isLoading) return <></>;
  dispatch(initialize({ competitionID }));
  dispatch(initUserId(participant?.id ?? 0));
  dispatch(initUserName(participant?.name ?? "訪客"));
  dispatch(initUserRole(participant?.role ?? "viewer"));
  dispatch(initUserStatus(participant?.status ?? "pending"));
  dispatch(
    initBoardMenu({
      role: participant?.role ?? "viewer",
      status: participant?.status ?? "pending",
    })
  );

  switch (boardShown) {
    case "score":
      board = <ScoreBoard></ScoreBoard>;
      break;
    case "recording":
      board = <RecordingBoard></RecordingBoard>;
      break;
    case "administration":
      board = <AdministrationBoard></AdministrationBoard>;
      break;
  }

  return (
    <div>
      <TopBar />
      <SubGamesBar />
      <div className="board">{board}</div>
      <BottomBar />
    </div>
  );
}

export default App;
