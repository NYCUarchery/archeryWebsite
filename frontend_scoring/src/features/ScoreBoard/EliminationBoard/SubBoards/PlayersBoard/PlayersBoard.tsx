import PlayerIntroBar from "./PlayerIntroBar";

interface Props {
  players: Player[];
}

interface Player {
  name: string;
  rank: number;
  score: number;
}

export default function PlayersBoard(props: Props) {
  return (
    <div className="players_board">
      {props.players.map((player) => (
        <PlayerIntroBar
          key={player.name}
          name={player.name}
          rank={player.rank}
          score={player.score}
        ></PlayerIntroBar>
      ))}
    </div>
  );
}
