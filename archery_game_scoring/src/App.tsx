import TopBar from "./components/Screen/TopBar"
import './App.css'
import SubGamesBar from "./components/Screen/SubGamesBar"
import BottomBar from "./components/Screen/BottomBar"
import { Outlet } from "react-router-dom"

function App(){
  return <div>
    <TopBar/>
    <SubGamesBar/>
    <Outlet/>
    <BottomBar/>
  </div>
}

export default App
