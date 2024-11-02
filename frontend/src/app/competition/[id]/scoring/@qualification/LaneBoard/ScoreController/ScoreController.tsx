import { ButtonGroup } from "@mui/material";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";
import { DatabaseRoundEnd } from "@/types/Api";

interface Props {
  selectedEnd: DatabaseRoundEnd;
  possibleScores: number[];
  onAddScore: (score: number) => void;
  onDeleteScore: () => void;
  onSendScore: () => void;
  onConfirm: () => void;
}

export default function ScoreController({
  selectedEnd,
  possibleScores,
  onAddScore,
  onDeleteScore,
  onSendScore,
  onConfirm,
}: Props) {
  const scoreButtons = [];

  for (let i = 0; i < possibleScores.length; i++) {
    scoreButtons.push(
      <ScoreButton
        key={i}
        score={possibleScores[i]}
        end={selectedEnd}
        onAddScore={onAddScore}
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
        onDeleteScore={onDeleteScore}
        onSendScore={onSendScore}
        onConfirm={onConfirm}
      ></ControllButtonGroup>
    </>
  );
}
