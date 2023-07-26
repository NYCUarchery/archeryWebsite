import NameBlock from "./NameBlock";
import PointBlock from "./PointBlock";
import ScoreBar from "./ScoreBar";

interface Props {
  player: any;
}

export default function PlayerBar(props: Props) {
  let className: string;
  props.player.is_winner
    ? (className = "player_bar winner")
    : (className = "player_bar");

  return (
    <div className={className}>
      <NameBlock name={props.player.name}></NameBlock>
      <ScoreBar scores={props.player.scores} />
      <PointBlock points={props.player.points}></PointBlock>
    </div>
  );
}
