import { Box } from "@mui/material";
import { useScoreColor } from "../../../../util/useScoreColor.tsx";

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
    <Box
      sx={{
        display: "flex",
        backgroundColor: scoreColor.backgroundColor,
        color: scoreColor.textColor,
        width: "20px",
        height: "20px",
        fontSize: "13px",
        marginBottom: "12px",
        borderRadius: "50%",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {content}
    </Box>
  );
}
