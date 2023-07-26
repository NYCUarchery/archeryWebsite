import PlayerIntroBar from "./PlayerIntroBar";
import { useSelector } from "react-redux/es/hooks/useSelector";

interface Props {
  players: Player[];
}

interface Player {
  name: string;
  rank: number;
  score: number;
}

export default function PlayersBoard(props: Props) {
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );

  if (stageShown !== 0) {
    return null;
  }
  return (
    <div className="players_board">
      {props.players.map((player) => (
        <PlayerIntroBar
          name={player.name}
          rank={player.rank}
          score={player.score}
        ></PlayerIntroBar>
      ))}
    </div>
  );
}
