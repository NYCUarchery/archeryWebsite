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
import useGetSelfParticipant from "./QueryHooks/useGetSelfParticipant";
import { initBoardMenu } from "./features/Screen/TopBar/BoardMenu/boardMenuSlice";
import useGetSelfUser from "./QueryHooks/useGetSelfUser";
import { initParticipant } from "./features/States/parcitipantSlice";
import { initUser } from "./features/States/userSlice";

function App() {
  const dispatch = useDispatch();
  const { competitionID } = useParams();
  dispatch(initialize({ competitionID }));
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);
  const { data: participant, isLoading: isParticipantLoading } =
    useGetSelfParticipant(Number(competitionID));
  const { data: user, isLoading: isUserLoading } = useGetSelfUser();
  let board: any;

  if (isParticipantLoading || isUserLoading) return <></>;
  if (user !== undefined) dispatch(initUser(user));
  if (participant !== undefined) {
    dispatch(initParticipant(participant));
    dispatch(initBoardMenu(participant));
  }

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
