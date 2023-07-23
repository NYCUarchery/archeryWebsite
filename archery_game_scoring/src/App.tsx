import TopBar from "./features/Screen/TopBar/TopBar";
import "./style/App.scss";
import SubGamesBar from "./features/Screen/SubGameBar/SubGamesBar";
import BottomBar from "./features/Screen/BottomBar/BottomBar";
import QualifyingPhaseBoard from "./features/QualifyingPhaseBoard/QualifyingPhaseBoard";
import EliminationBoard from "./features/EliminationBoard/EliminationBoard";

function App() {
  return (
    <div>
      <TopBar />
      <SubGamesBar />
      <QualifyingPhaseBoard />
      <EliminationBoard />
      <BottomBar />
    </div>
  );
}

export default App;
