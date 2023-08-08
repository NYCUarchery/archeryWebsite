import ConfirmationSignal from "./ConfirmationSignal";
import NameBar from "./NameBar";
import ScoreBar from "./ScoreBar";

interface Props {
  name: string;
  comfirmed: boolean;
  scores: number[];
}

export default function PlayerInfo(props: Props) {
  return (
    <div className="player_info_bar">
      <ConfirmationSignal confirmed={props.comfirmed}></ConfirmationSignal>
      <NameBar name={props.name}></NameBar>
      <ScoreBar scores={props.scores}></ScoreBar>
    </div>
  );
}
