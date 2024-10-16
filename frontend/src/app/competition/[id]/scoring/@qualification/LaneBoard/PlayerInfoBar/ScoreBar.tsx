import ScoreBlock from "./ScoreBlock";

interface Props {
  scores: number[];
}

export default function ScoreBar(props: Props) {
  const scoreBlocks = [];
  for (let i = 0; i < props.scores.length; i++) {
    scoreBlocks.push(<ScoreBlock key={i} score={props.scores[i]}></ScoreBlock>);
  }

  return <div className="score_bar">{scoreBlocks}</div>;
}
