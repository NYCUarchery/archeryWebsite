import { ButtonGroup } from "@mui/material";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";

interface Props {
  selectedPlayer: number;
  possibleScores: number[];
}

export default function ScoreController(props: Props) {
  let scoreButtons = [];
  for (let i = 0; i < props.possibleScores.length; i++) {
    scoreButtons.push(
      <ScoreButton
        key={i}
        selectedPlayer={props.selectedPlayer}
        score={props.possibleScores[i]}
      ></ScoreButton>
    );
  }

  return (
    <>
      <ButtonGroup className="score_button_group" variant="text">
        {scoreButtons}
      </ButtonGroup>
      <ControllButtonGroup></ControllButtonGroup>
    </>
  );
}
