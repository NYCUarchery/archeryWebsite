import NameBar from "./NameBar";
import ScoreBar from "./ScoreBar";

interface Props {
  name: string;
  scores: number[];
}

export default function PlayerInfo(props: Props) {
  return (
    <div className="player_info_bar">
      <NameBar name={props.name}></NameBar>
      <ScoreBar scores={props.scores}></ScoreBar>
    </div>
  );
}
