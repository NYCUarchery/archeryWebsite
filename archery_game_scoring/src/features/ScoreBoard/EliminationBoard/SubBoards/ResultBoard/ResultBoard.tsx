import { useSelector } from "react-redux";
import ResultBar from "./ResultBar";

interface Props {
  players: Player[];
}

interface Player {
  name: string;
  medal: string;
}

export default function ResultBoard(props: Props) {
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);

  if (stageShown !== stageNum + 1) {
    return null;
  }

  return (
    <div className="result_board">
      {props.players.map((player) => (
        <ResultBar name={player.name} medal={player.medal}></ResultBar>
      ))}
    </div>
  );
}
