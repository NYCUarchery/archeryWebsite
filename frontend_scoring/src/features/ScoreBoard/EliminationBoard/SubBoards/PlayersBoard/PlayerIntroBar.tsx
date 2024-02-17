interface Props {
  name: string;
  rank: number;
  score: number;
}

export default function PlayerIntroBar(props: Props) {
  return (
    <div className="player_intro_bar">
      <div className="rank_block">{props.rank}</div>
      <div className="name_block">{props.name}</div>
      <div className="score_block">{props.score}</div>
    </div>
  );
}
