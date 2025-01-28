import CircleSign from "./CircleSign";
import { useScoreColor } from "@/utils/useScoreColor";

interface Props {
  score: number;
  diameter?: number;
}
export default function ScoreCircle(props: Props) {
  const scoreColor = useScoreColor(props.score);
  let text: string = props.score.toString();

  if (props.score === 0) {
    text = "M";
  } else if (props.score === 11) {
    text = "X";
  }

  return (
    <CircleSign
      color={scoreColor.textColor}
      backgroundColor={scoreColor.backgroundColor}
      diameter={props.diameter ? props.diameter : 25}
      fontSize={props.diameter ? (props.diameter / 5) * 3 : 15}
      text={text}
    ></CircleSign>
  );
}
