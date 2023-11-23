interface Props {
  score: number;
}

export default function ScoreBlock(props: Props) {
  let content: string = "";

  switch (props.score) {
    case -1:
      return <></>;
    case 0:
      content = "M";
      break;
    case 11:
      content = "X";
      break;
    default:
      content = props.score.toString();
  }

  return (
    <div className="score_block single_score" id={props.score.toString()}>
      {content}
    </div>
  );
}
