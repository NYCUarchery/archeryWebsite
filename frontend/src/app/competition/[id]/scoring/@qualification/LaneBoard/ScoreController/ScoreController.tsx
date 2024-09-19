import { ButtonGroup } from "@mui/material";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";
import { RoundEnd } from "@/types/oldRef/Player";

interface Props {
  selectedEnd: RoundEnd;
  possibleScores: number[];
  onScoreChange: (score: number) => void;
}

export default function ScoreController({
  selectedEnd,
  possibleScores,
  onScoreChange,
}: Props) {
  let scoreButtons = [];

  for (let i = 0; i < possibleScores.length; i++) {
    scoreButtons.push(
      <ScoreButton
        key={i}
        score={possibleScores[i]}
        end={selectedEnd}
        onClick={onScoreChange}
      ></ScoreButton>
    );
  }

  return (
    <>
      <ButtonGroup
        className="score_button_group"
        variant="text"
        disabled={selectedEnd?.is_confirmed}
        disableElevation
      >
        {scoreButtons}
      </ButtonGroup>
      <ControllButtonGroup
        selectedEnd={selectedEnd}
        isConfirmed={selectedEnd?.is_confirmed ?? false}
      ></ControllButtonGroup>
    </>
  );
}
