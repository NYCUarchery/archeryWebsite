"use client";

import { Button, ButtonGroup, Stack, Typography } from "@mui/material";

export type CompetitionPhase = 0 | 1 | 2 | 3;

export interface PhaseOption {
  phase: CompetitionPhase;
  label: string;
  isActive: boolean | undefined;
}

interface Props {
  currentPhase: number | undefined;
  options: PhaseOption[];
  isUpdating: boolean;
  onSelect: (phase: CompetitionPhase) => void;
}

export default function PhaseControl({
  currentPhase,
  options,
  isUpdating,
  onSelect,
}: Props) {
  const availableOptions = options.filter((option) => option.isActive);
  const selectedIndex = availableOptions.findIndex(
    (option) => option.phase === currentPhase
  );
  const previous =
    selectedIndex > 0 ? availableOptions[selectedIndex - 1] : undefined;
  const next =
    selectedIndex >= 0 && selectedIndex < availableOptions.length - 1
      ? availableOptions[selectedIndex + 1]
      : undefined;

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6">選手目前畫面</Typography>
      <Typography variant="body2" color="text.secondary">
        選擇選手端要顯示的賽程階段。未開啟的賽制不可選擇。
      </Typography>
      <ButtonGroup aria-label="選手目前畫面">
        <Button
          onClick={() => previous && onSelect(previous.phase)}
          disabled={!previous || isUpdating}
        >
          上一階段
        </Button>
        <Button
          onClick={() => next && onSelect(next.phase)}
          disabled={!next || isUpdating}
        >
          下一階段
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="直接選擇選手畫面" variant="contained">
        {options.map((option) => (
          <Button
            key={option.phase}
            color={option.phase === currentPhase ? "success" : "primary"}
            disabled={!option.isActive || isUpdating}
            onClick={() => onSelect(option.phase)}
          >
            {option.label}
          </Button>
        ))}
      </ButtonGroup>
      {selectedIndex === -1 && availableOptions.length > 0 && (
        <Typography color="warning.main" variant="body2">
          目前階段無效或尚未開啟；請直接選擇一個已開啟的賽制復原。
        </Typography>
      )}
      {availableOptions.length === 0 && (
        <Typography color="warning.main" variant="body2">
          請先在上方開啟至少一個賽制。
        </Typography>
      )}
    </Stack>
  );
}
