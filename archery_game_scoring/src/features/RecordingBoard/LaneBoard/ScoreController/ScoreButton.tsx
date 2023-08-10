import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { addScore } from "./scoreControllerSlice";

interface Props {
  selectedPlayer: number;
  score: number;
}

export default function ScoreButton(props: Props) {
  const dispatch = useDispatch();
  let content: string = "";
  const handleOnClick = () => {
    dispatch(addScore({ player: props.selectedPlayer, score: props.score }));
  };

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
    <Button
      className="score_button single_score"
      id={props.score.toString()}
      onClick={handleOnClick}
    >
      {content}
    </Button>
  );
}
