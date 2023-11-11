import ConfirmationSignal from "./ConfirmationSignal";
import NameBar from "./NameBar";
import ScoreBar from "./ScoreBar";
import { useSelector } from "react-redux";

interface Props {
  player: number;
  name: string;
}

export default function PlayerInfo(props: Props) {
  const confirmations = useSelector(
    (state: any) => state.scoreController.confirmations
  );
  const allScores = useSelector(
    (state: any) => state.scoreController.allScores
  );

  return (
    <div className="player_info_bar">
      <ConfirmationSignal
        confirmed={confirmations[props.player]}
      ></ConfirmationSignal>
      <NameBar name={props.name}></NameBar>
      <ScoreBar scores={allScores[props.player]}></ScoreBar>
    </div>
  );
}
