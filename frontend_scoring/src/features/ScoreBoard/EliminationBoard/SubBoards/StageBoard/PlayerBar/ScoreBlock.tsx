interface Props {
  score: number;
}

export default function ScoreBlock(props: Props) {
  return (
    <div className="score_block">{props.score === -1 ? "" : props.score}</div>
  );
}
