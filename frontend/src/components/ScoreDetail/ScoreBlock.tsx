import { Avatar } from "@mui/material";
import { useScoreColor } from "@/utils/useScoreColor";

interface Props {
  score: number;
}

export default function ScoreBlock(props: Props) {
  let content: string = "";
  let scoreColor = useScoreColor(props.score);

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
    <Avatar
      sx={{
        backgroundColor: scoreColor.backgroundColor,
        color: scoreColor.textColor,
        width: "20px",
        height: "20px",
        fontSize: "13px",
      }}
    >
      {content}
    </Avatar>
  );
}
