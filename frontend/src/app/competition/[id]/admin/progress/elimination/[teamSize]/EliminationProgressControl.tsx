"use client";

import {
  Alert,
  Button,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { DatabaseElimination } from "@/types/Api";

interface Props {
  elimination: DatabaseElimination | undefined;
  teamSize: number;
  isPhaseActive: boolean | undefined;
  isLoading: boolean;
  isError: boolean;
  isUpdating: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onChange: (currentStage: number, currentEnd: number) => void;
}

function standardStageDenominators(
  stages: NonNullable<DatabaseElimination["stages"]>
) {
  const firstStageMatchCount = stages[0]?.matchs?.length ?? 0;
  if (
    firstStageMatchCount < 1 ||
    !Number.isInteger(Math.log2(firstStageMatchCount))
  ) {
    return null;
  }

  const expectedStageCount = Math.log2(firstStageMatchCount) + 1;
  if (stages.length !== expectedStageCount) {
    return null;
  }

  const denominators = stages.map(
    (_, index) => firstStageMatchCount / 2 ** index
  );
  const isStandard = stages.every((stage, index) => {
    const isFinalStage = index === stages.length - 1;
    const expectedMatchCount = isFinalStage ? 2 : denominators[index];
    return stage.matchs?.length === expectedMatchCount;
  });
  return isStandard ? denominators : null;
}

function stageLabel(index: number, denominators: number[] | null) {
  const denominator = denominators?.[index];
  if (denominator === undefined) return `第 ${index + 1} 階段`;
  if (denominator === 1) return "決賽";
  if (denominator === 2) return "準決賽";
  return `1/${denominator}`;
}

export default function EliminationProgressControl({
  elimination,
  teamSize,
  isPhaseActive,
  isLoading,
  isError,
  isUpdating,
  errorMessage,
  onDismissError,
  onChange,
}: Props) {
  if (isLoading) {
    return <Typography color="text.secondary">正在載入對抗賽進度…</Typography>;
  }

  if (isError) {
    return <Alert severity="error">無法載入這個項目的對抗賽進度。</Alert>;
  }

  if (isPhaseActive === false) {
    return <Alert severity="info">請先在賽程控制頁開啟這個賽制。</Alert>;
  }

  if (!elimination) {
    return <Alert severity="info">此組別尚未建立這個項目的對抗賽。</Alert>;
  }

  const stages = elimination.stages ?? [];
  const stageDenominators = standardStageDenominators(stages);
  const currentStage = elimination.current_stage ?? -1;
  const currentEnd = elimination.current_end ?? -1;
  const currentStageIsValid =
    currentStage >= 0 && currentStage < stages.length;
  const currentStageHasMatches =
    currentStageIsValid && Boolean(stages[currentStage]?.matchs?.length);
  const waveCount = teamSize === 1 ? 5 : 4;
  const currentEndIsValid = currentEnd >= 0 && currentEnd < waveCount;
  const previousStage = currentStage - 1;
  const nextStage = currentStage + 1;
  const canGoPreviousStage =
    currentStageIsValid &&
    previousStage >= 0 &&
    Boolean(stages[previousStage]?.matchs?.length);
  const canGoNextStage =
    currentStageIsValid &&
    nextStage < stages.length &&
    Boolean(stages[nextStage]?.matchs?.length);

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6">對抗賽進度</Typography>
      {!currentStageIsValid && (
        <Alert severity="warning">
          目前強賽索引已超出範圍；請選擇下方存在的強賽以復原。
        </Alert>
      )}
      {!currentEndIsValid && (
        <Alert severity="warning">
          目前波次已超出範圍；請選擇下方合法波次以復原。
        </Alert>
      )}
      <Typography variant="subtitle2">強賽</Typography>
      <Stack direction="row" spacing={1} aria-label="強賽前後切換">
        <Button
          fullWidth
          size="small"
          disabled={!canGoPreviousStage || isUpdating}
          onClick={() => onChange(previousStage, 0)}
        >
          上一強賽
        </Button>
        <Button
          fullWidth
          size="small"
          disabled={!canGoNextStage || isUpdating}
          onClick={() => onChange(nextStage, 0)}
        >
          下一強賽
        </Button>
      </Stack>
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        gap={1}
        aria-label="直接選擇強賽"
      >
        {stages.map((stage, index) => (
          <Button
            key={stage.id ?? index}
            size="small"
            variant="contained"
            color={index === currentStage ? "success" : "primary"}
            disabled={!stage.matchs?.length || isUpdating}
            onClick={() =>
              onChange(
                index,
                index === currentStage && currentEndIsValid ? currentEnd : 0
              )
            }
          >
            {stageLabel(index, stageDenominators)}
          </Button>
        ))}
      </Stack>
      {stages.length === 0 && (
        <Alert severity="info">尚未建立任何強賽或賽程。</Alert>
      )}
      <Typography variant="subtitle2">波次</Typography>
      <Stack direction="row" spacing={1} aria-label="波次前後切換">
        <Button
          fullWidth
          size="small"
          disabled={!currentEndIsValid || currentEnd <= 0 || isUpdating}
          onClick={() => onChange(currentStage, currentEnd - 1)}
        >
          上一波
        </Button>
        <Button
          fullWidth
          size="small"
          disabled={
            !currentEndIsValid || currentEnd >= waveCount - 1 || isUpdating
          }
          onClick={() => onChange(currentStage, currentEnd + 1)}
        >
          下一波
        </Button>
      </Stack>
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        gap={1}
        aria-label="直接選擇波次"
      >
        {Array.from({ length: waveCount }, (_, index) => (
          <Button
            key={index}
            size="small"
            variant="contained"
            color={index === currentEnd ? "success" : "primary"}
            disabled={!currentStageHasMatches || isUpdating}
            onClick={() => onChange(currentStage, index)}
          >
            第 {index + 1} 波
          </Button>
        ))}
      </Stack>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={onDismissError}
      >
        <Alert severity="error" onClose={onDismissError} sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
