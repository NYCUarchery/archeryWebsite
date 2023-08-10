import { ButtonGroup } from "@mui/material";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";

interface Props {
  possibleScores: number[];
}

export default function ScoreController(props: Props) {
  let scoreButtons = [];
  for (let i = 0; i < props.possibleScores.length; i++) {
    scoreButtons.push(
      <ScoreButton score={props.possibleScores[i]}></ScoreButton>
    );
  }

  return (
    <>
      <ButtonGroup className="score_button_group">{scoreButtons}</ButtonGroup>
      <ControllButtonGroup></ControllButtonGroup>
    </>
  );
}
