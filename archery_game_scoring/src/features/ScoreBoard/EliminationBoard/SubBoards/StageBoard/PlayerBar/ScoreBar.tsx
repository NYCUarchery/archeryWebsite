import ScoreBlock from "./ScoreBlock";

interface Props {
  scores: number[];
}

export default function ScoreBar(props: Props) {
  let scores = [];
  for (let i = 0; i < 6; i++) {
    if (i >= props.scores.length) {
      scores.push(<ScoreBlock key={i} score={-1} />);
      continue;
    }
    scores.push(<ScoreBlock key={i} score={props.scores[i]} />);
  }
  return <div className="score_bar">{scores}</div>;
}
