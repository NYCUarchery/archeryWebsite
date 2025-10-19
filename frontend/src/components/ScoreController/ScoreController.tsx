import Grid from "@mui/material/Grid2";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";
import { DatabaseRoundEnd } from "@/types/Api";

interface Props {
  selectedEnd: DatabaseRoundEnd;
  possibleScores: number[];
  onAddScore: (score: number) => void;
  onDeleteScore: () => void;
  onSendScore: () => void;
  onConfirm?: () => void;
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
      <Grid size={3} style={{ display: "flex", justifyContent: "center" }}>
        <ScoreButton
          key={i}
          score={possibleScores[i]}
          end={selectedEnd}
          onAddScore={onAddScore}
        ></ScoreButton>
      </Grid>
    );
  }

  return (
    <>
      <Grid container spacing={1} sx={{ mt: 2, mb: 2 }}>
        {scoreButtons}
      </Grid>
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
