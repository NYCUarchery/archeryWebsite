import ScoreBlock from "./ScoreBlock";

interface Props {
  scores: number[];
}

export default function ScoreBar(props: Props) {
  let scores: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (i >= props.scores.length) {
      scores.push(-1);
      continue;
    }
    scores.push(props.scores[i]);
  }
  return (
    <div className="score_bar">
      {scores.map((score: number) => (
        <ScoreBlock score={score} />
      ))}
    </div>
  );
}
