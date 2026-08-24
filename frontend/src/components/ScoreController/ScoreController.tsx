import Grid from "@mui/material/Grid2";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";

// 泛型 ScoreController：不依賴 DatabaseRoundEnd，僅依 scores/isConfirmed 等基本資料顯示
interface Props {
  scores: number[]; // 含 -1 佔位之分數陣列；顯示與停用據此
  isConfirmed: boolean;
  maximumArrowCount: number; // 該局容量（3/4/6）
  possibleScores: number[];
  onAddScore: (score: number) => void;
  onDeleteScore: () => void;
  onSave: () => void;
  onConfirm?: () => void;
  isSaving?: boolean;
  canConfirm?: boolean; // false 表示尚未選定記分對象，確認鈕停用
}

export default function ScoreController({
  scores,
  isConfirmed,
  maximumArrowCount,
  possibleScores,
  onAddScore,
  onDeleteScore,
  onSave,
  onConfirm,
  isSaving = false,
  canConfirm = true,
}: Props) {
  const filledCount = scores.filter((s) => s !== -1).length;
  const isFull = filledCount >= maximumArrowCount;
  const canDelete = !isConfirmed && filledCount > 0;

  const scoreButtons = [];

  for (let i = 0; i < possibleScores.length; i++) {
    scoreButtons.push(
      <Grid size={3} style={{ display: "flex", justifyContent: "center" }}>
        <ScoreButton
          key={i}
          score={possibleScores[i]}
          disabled={isConfirmed || isFull}
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
        isConfirmed={isConfirmed}
        canDelete={canDelete}
        isSaving={isSaving}
        canConfirm={canConfirm}
        onDeleteScore={onDeleteScore}
        onSave={onSave}
        onConfirm={onConfirm}
      ></ControllButtonGroup>
    </>
  );
}
