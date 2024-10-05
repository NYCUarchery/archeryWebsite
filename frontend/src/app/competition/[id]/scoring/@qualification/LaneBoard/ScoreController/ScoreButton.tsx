import { Button } from "@mui/material";
import { findLastScoreInEnd } from "../util";
import { DatabaseRoundEnd } from "@/types/Api";

const buttonColors = new Map([
  [0, "black_score"],
  [1, "white_score"],
  [2, "white_score"],
  [3, "black_score"],
  [4, "black_score"],
  [5, "blue_score"],
  [6, "blue_score"],
  [7, "red_score"],
  [8, "red_score"],
  [9, "yellow_score"],
  [10, "yellow_score"],
  [11, "yellow_score"],
]);

interface Props {
  end: DatabaseRoundEnd;
  score: number;
  onAddScore: (score: number) => void;
}

export default function ScoreButton({ end, score, onAddScore }: Props) {
  let content = "";
  const buttonColor = buttonColors.get(score) as string;

  const lastScore = findLastScoreInEnd(end);

  switch (score) {
    case 0:
      content = "M";
      break;
    case 11:
      content = "X";
      break;
    default:
      content = score.toString();
  }

  return (
    <Button
      disabled={
        end === undefined || end?.is_confirmed || lastScore === undefined
      }
      id={score.toString()}
      onClick={() => onAddScore(score)}
      variant="contained"
      color={buttonColor as unknown as undefined}
      sx={{
        boxShadow: "none",
        borderRadius: "0px",
        width: "20%",
        height: "3rem",
        fontSize: "1rem",
      }}
    >
      {content}
    </Button>
  );
}
