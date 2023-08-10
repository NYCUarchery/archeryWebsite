import { Button } from "@mui/material";

interface Props {
  score: number;
}

export default function ScoreButton(props: Props) {
  let content: string = "";

  switch (props.score) {
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
    <Button className="score_button single_score" id={props.score.toString()}>
      {content}
    </Button>
  );
}
