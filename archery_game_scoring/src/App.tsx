import TopBar from "./features/Screen/TopBar"
import './App.css'
import SubGamesBar from "./features/Screen/SubGamesBar"
import BottomBar from "./features/Screen/BottomBar"
import QualifyingPhaseBoard from "./features/QualifyingPhaseBoard/QualifyingPhaseBoard"



function App(){
  return <div>
    <TopBar/>
    <SubGamesBar/>
    <QualifyingPhaseBoard/>
    <BottomBar/>
  </div>
}

export default App
