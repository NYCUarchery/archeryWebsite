import NameBlock from "./NameBlock";
import PointBlock from "./PointBlock";
import ScoreBar from "./ScoreBar";

interface Props {
  player: any;
}

export default function PlayerBar(props: Props) {
  return (
    <div className="player_bar">
      <NameBlock
        name={props.player.name}
        isWinner={props.player.is_winner}
      ></NameBlock>
      <ScoreBar scores={props.player.scores} />
      <PointBlock points={props.player.points}></PointBlock>
    </div>
  );
}
