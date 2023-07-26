import TopBar from "./features/Screen/TopBar/TopBar";
import "./style/App.scss";
import SubGamesBar from "./features/Screen/SubGameBar/SubGamesBar";
import BottomBar from "./features/Screen/BottomBar/BottomBar";
import ScoreBoard from "./features/ScoreBoard/ScoreBoard";

function App() {
  return (
    <div>
      <TopBar />
      <SubGamesBar />
      <ScoreBoard></ScoreBoard>
      <BottomBar />
    </div>
  );
}

export default App;
