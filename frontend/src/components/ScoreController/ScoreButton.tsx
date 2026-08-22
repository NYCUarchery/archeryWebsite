import { Button } from "@mui/material";

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

// 泛型分數按鈕：僅依 score 與外部算好的 disabled 決定顯示與可用性
interface Props {
  score: number;
  disabled: boolean;
  onAddScore: (score: number) => void;
}

export default function ScoreButton({ score, disabled, onAddScore }: Props) {
  let content = "";
  const buttonColor = buttonColors.get(score) as string;

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
      disabled={disabled}
      id={score.toString()}
      onClick={() => onAddScore(score)}
      variant="contained"
      color={buttonColor as unknown as undefined}
      sx={{
        boxShadow: "none",
        width: "100%",
        height: "3rem",
        fontSize: "1rem",
      }}
    >
      {content}
    </Button>
  );
}
