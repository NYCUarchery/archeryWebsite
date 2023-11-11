import ResultBar from "./ResultBar";

interface Props {
  players: Player[];
}

interface Player {
  name: string;
  medal: string;
}

export default function ResultBoard(props: Props) {
  return (
    <div className="result_board">
      {props.players.map((player) => (
        <ResultBar
          key={player.name}
          name={player.name}
          medal={player.medal}
        ></ResultBar>
      ))}
    </div>
  );
}
