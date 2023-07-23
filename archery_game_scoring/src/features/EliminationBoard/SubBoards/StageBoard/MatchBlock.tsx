import PlayerBar from "./PlayerBar/PlayerBar";

interface Props {
  match: Match;
}

interface Match {
  players: Player[];
}

interface Player {
  name: string;
  scores: number;
  points: number;
  isWinner: boolean;
}

export default function MatchBlock(props: Props) {
  return (
    <div className="match_block">
      {props.match.players.map((player: any) => (
        <PlayerBar player={player}></PlayerBar>
      ))}
    </div>
  );
}
