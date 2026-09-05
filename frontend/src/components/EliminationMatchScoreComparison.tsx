import {
  Box,
  ButtonBase,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Filter1Icon from "@mui/icons-material/Filter1";
import Filter2Icon from "@mui/icons-material/Filter2";
import Filter3Icon from "@mui/icons-material/Filter3";
import Filter4Icon from "@mui/icons-material/Filter4";
import Filter5Icon from "@mui/icons-material/Filter5";
import FunctionsIcon from "@mui/icons-material/Functions";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import EditIcon from "@mui/icons-material/Edit";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import type { ReactNode } from "react";
import type { DatabaseMatchEnd, DatabaseMatchResult } from "@/types/Api";
import ScoreBlock from "@/components/ScoreBlock";

type DisplayedPoints = { value?: number; predicted: boolean };

function formatScore(score: number): string {
  if (score === 11) return "X";
  if (score === 0) return "M";
  return String(score);
}

function isCompleteEnd(end?: DatabaseMatchEnd): boolean {
  return Boolean(
    end?.match_scores?.length &&
      end.match_scores.every(
        (matchScore) =>
          matchScore.score !== undefined && matchScore.score >= 0,
      ),
  );
}

function inferPoints(
  ownEnd?: DatabaseMatchEnd,
  otherEnd?: DatabaseMatchEnd,
): number | undefined {
  const ownScores = ownEnd?.match_scores;
  const otherScores = otherEnd?.match_scores;
  if (
    !isCompleteEnd(ownEnd) || !isCompleteEnd(otherEnd) ||
    !ownScores || !otherScores || ownScores.length !== otherScores.length
  ) {
    return undefined;
  }
  const scoreTotal = (scores: NonNullable<DatabaseMatchEnd["match_scores"]>) =>
    scores.reduce(
      (total, score) => total + (score.score === 11 ? 10 : score.score ?? 0),
      0,
    );
  const ownTotal = scoreTotal(ownScores);
  const otherTotal = scoreTotal(otherScores);
  if (ownTotal === otherTotal) return 1;
  return ownTotal > otherTotal ? 2 : 0;
}

function getDisplayedPoints(
  ownEnd?: DatabaseMatchEnd,
  otherEnd?: DatabaseMatchEnd,
): DisplayedPoints {
  const predicted =
    isCompleteEnd(ownEnd) &&
    isCompleteEnd(otherEnd) &&
    (!ownEnd?.is_confirmed || !otherEnd?.is_confirmed);
  const value = ownEnd?.points ?? inferPoints(ownEnd, otherEnd);
  return { value, predicted: predicted && value !== undefined };
}

export type EliminationMatchScoreComparisonSide = {
  label: string;
  matchResult?: DatabaseMatchResult;
  header?: ReactNode;
};

export type EliminationMatchScoreComparisonProps = {
  side1: EliminationMatchScoreComparisonSide;
  side2: EliminationMatchScoreComparisonSide;
  /** 管理頁注入確認切換；共用元件本身不呼叫 API。 */
  onToggleConfirmation?: (end: DatabaseMatchEnd, isConfirmed: boolean) => void;
  /** 管理頁注入單波改分視窗；缺少的波次不會觸發。 */
  onEditEnd?: (end: DatabaseMatchEnd) => void;
  /** 正在寫入的波次 ID；該波所有操作會暫停。 */
  updatingEndIds?: number[];
  /** 裁判頁不得把已確認波次改回未確認；管理監控頁保留原本解除功能。 */
  allowUnconfirm?: boolean;
  /** 目前賽事進行中的波次（0-based），以外框標示。 */
  currentEndIndex?: number;
  disabled?: boolean;
};

function SideHeader({
  side,
  sideIndex,
}: {
  side: EliminationMatchScoreComparisonSide;
  sideIndex: 1 | 2;
}) {
  const { matchResult } = side;
  return (
    <Stack data-testid={`match-score-side-${sideIndex}`} useFlexGap spacing={1} alignItems="stretch" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
      <Box sx={{ minHeight: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {matchResult?.is_winner && <Chip label="勝方" color="success" size="small" />}
      </Box>
      {side.header ?? (
        <Typography component="span" fontWeight={700} variant="body2">
          {side.label}
        </Typography>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" color="text.secondary">
        <Typography variant="caption">對抗點數：{matchResult?.total_points ?? "—"}</Typography>
        {matchResult?.shoot_off_score !== undefined &&
          matchResult.shoot_off_score >= 0 && (
            <Typography variant="caption">加射：{formatScore(matchResult.shoot_off_score)}</Typography>
          )}
      </Stack>
    </Stack>
  );
}

function WaveIcon({ index }: { index: number }) {
  const Icon = [Filter1Icon, Filter2Icon, Filter3Icon, Filter4Icon, Filter5Icon][index];
  const label = `第 ${index + 1} 波`;
  if (Icon) {
    return (
      <Tooltip title={label}>
        <Icon aria-label={label} color="primary" fontSize="small" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={label}>
      <Box
        aria-label={label}
        sx={{
          border: 1,
          borderColor: "primary.main",
          borderRadius: "50%",
          color: "primary.main",
          fontSize: "0.75rem",
          fontWeight: 700,
          height: 24,
          lineHeight: "22px",
          textAlign: "center",
          width: 24,
        }}
      >
        {index + 1}
      </Box>
    </Tooltip>
  );
}

function ScoreMetric({
  icon,
  label,
  value,
  predicted = false,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  predicted?: boolean;
}) {
  const text = value === undefined ? "—" : String(value);
  const ariaLabel = `${label}：${text}${predicted ? "（預估）" : ""}`;
  return (
    <Tooltip title={ariaLabel}>
      <Stack direction="row" spacing={0.25} alignItems="center" aria-label={ariaLabel}>
        {icon}
        <Typography component="span" variant="caption" fontWeight={600}>{text}</Typography>
        {predicted && <HourglassBottomIcon color="warning" fontSize="inherit" aria-label="預估點數" />}
      </Stack>
    </Tooltip>
  );
}

function EndCell({
  end,
  otherEnd,
  cumulativePoints,
  onToggleConfirmation,
  onEditEnd,
  isUpdating = false,
  disabled = false,
  allowUnconfirm = true,
  isCurrentEnd = false,
  sideLabel,
}: {
  end?: DatabaseMatchEnd;
  otherEnd?: DatabaseMatchEnd;
  cumulativePoints?: number;
  onToggleConfirmation?: (end: DatabaseMatchEnd, isConfirmed: boolean) => void;
  onEditEnd?: (end: DatabaseMatchEnd) => void;
  isUpdating?: boolean;
  disabled?: boolean;
  allowUnconfirm?: boolean;
  isCurrentEnd?: boolean;
  sideLabel?: string;
}) {
  if (!end) return <Typography color="text.secondary">—</Typography>;

  const points = getDisplayedPoints(end, otherEnd);
  const confirmed = Boolean(end.is_confirmed);
  const status = confirmed ? "已確認" : "未確認";
  return (
    <Stack
      spacing={0.5}
      alignItems="center"
      aria-label={`${status}波次比分`}
      data-status={confirmed ? "confirmed" : "unconfirmed"}
      data-current-end={isCurrentEnd ? "true" : undefined}
      sx={{
        backgroundColor: confirmed
          ? "rgba(46, 125, 50, 0.12)"
          : "rgba(211, 47, 47, 0.12)",
        border: isCurrentEnd ? 2 : 0,
        borderColor: isCurrentEnd ? "primary.main" : "transparent",
        borderRadius: 1,
        minHeight: 104,
        p: 1,
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        justifyContent: "center",
      }}
    >
      {sideLabel && (
        <Typography sx={{ display: { xs: "block", md: "none" }, overflowWrap: "anywhere" }} variant="subtitle2" fontWeight={700} align="center">
          {sideLabel}
        </Typography>
      )}
      <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
        {(end.match_scores ?? []).map((matchScore, index) =>
          matchScore.score !== undefined && matchScore.score >= 0 ? (
            <ScoreBlock key={matchScore.id ?? index} score={matchScore.score} size="1.1rem" />
          ) : (
            <Typography key={matchScore.id ?? index} component="span" aria-label="未記分">—</Typography>
          ),
        )}
      </Stack>
      <Stack direction="row" spacing={0.75} justifyContent="center" flexWrap="wrap">
        <ScoreMetric icon={<ScoreboardIcon aria-label="箭分總分" fontSize="inherit" />} label="箭分總分" value={end.total_scores} />
        <ScoreMetric icon={<AddCircleIcon aria-label="本波點數" fontSize="inherit" />} label="本波點數" value={points.value} predicted={points.predicted} />
        <ScoreMetric icon={<FunctionsIcon aria-label="累積點數" fontSize="inherit" />} label="累積點數" value={end.cumulative_points ?? cumulativePoints} />
      </Stack>
      <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center">
        <Tooltip title={onToggleConfirmation && (!confirmed || allowUnconfirm) ? `切換為${confirmed ? "未確認" : "已確認"}` : status}>
          <span>
            <ButtonBase
              aria-label={onToggleConfirmation && (!confirmed || allowUnconfirm) ? `切換為${confirmed ? "未確認" : "已確認"}` : status}
              disabled={disabled || isUpdating || !onToggleConfirmation || (confirmed && !allowUnconfirm)}
              onClick={() => onToggleConfirmation?.(end, !confirmed)}
              sx={{ borderRadius: 0.75, px: 0.5, py: 0.25 }}
            >
              {confirmed ? <CheckCircleIcon aria-label="已確認" color="success" fontSize="small" /> : <CancelIcon aria-label="未確認" color="error" fontSize="small" />}
              <Typography variant="caption" sx={{ ml: 0.25 }}>{isUpdating ? "更新中…" : status}</Typography>
            </ButtonBase>
          </span>
        </Tooltip>
        {onEditEnd && (
          <Tooltip title="編輯本波分數">
            <span>
              <IconButton
                aria-label="編輯本波分數"
                size="small"
                disabled={disabled || isUpdating}
                onClick={() => onEditEnd(end)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );
}

function cumulativePoints(
  ends: DatabaseMatchEnd[],
  opponents: DatabaseMatchEnd[],
): Array<number | undefined> {
  let total = 0;
  let hasPoint = false;
  return ends.map((end, index) => {
    const points = getDisplayedPoints(end, opponents[index]).value;
    if (points !== undefined) {
      total += points;
      hasPoint = true;
    }
    return hasPoint ? total : undefined;
  });
}

/** 呈現淘汰賽雙方各波箭分與判勝資訊；管理操作由選填 callback 注入。 */
export default function EliminationMatchScoreComparison({
  side1,
  side2,
  onToggleConfirmation,
  onEditEnd,
  updatingEndIds = [],
  allowUnconfirm = true,
  currentEndIndex,
  disabled = false,
}: EliminationMatchScoreComparisonProps) {
  const side1Ends = side1.matchResult?.match_ends ?? [];
  const side2Ends = side2.matchResult?.match_ends ?? [];
  const endCount = Math.max(side1Ends.length, side2Ends.length);
  const side1Cumulative = cumulativePoints(side1Ends, side2Ends);
  const side2Cumulative = cumulativePoints(side2Ends, side1Ends);

  return (
    <Paper
      variant="outlined"
      data-testid="elimination-match-score-comparison"
      tabIndex={0}
      aria-label="淘汰賽比分比較；手機版依波次直向排列，桌機版以雙方對照呈現"
      sx={{
        overflowX: { xs: "visible", md: "auto" },
        p: 1,
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Box
        data-testid="elimination-match-score-header"
        sx={{
          display: "grid",
          gridTemplateAreas: {
            xs: '"side1" "side2"',
            md: '"side1 versus side2"',
          },
          gap: 0.75,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(360px, 1fr) 72px minmax(360px, 1fr)" },
          minWidth: { md: 792 },
        }}
      >
        <Box sx={{ gridArea: "side1", minWidth: 0 }}><SideHeader side={side1} sideIndex={1} /></Box>
        <Stack sx={{ gridArea: "versus", display: { xs: "none", md: "flex" } }} alignItems="center" justifyContent="center" spacing={0.25}>
          <Tooltip title="對抗">
            <SportsKabaddiIcon aria-label="對抗" color="primary" fontSize="small" />
          </Tooltip>
          <Typography variant="caption" color="text.secondary">對抗</Typography>
        </Stack>
        <Box sx={{ gridArea: "side2", minWidth: 0 }}><SideHeader side={side2} sideIndex={2} /></Box>
      </Box>
      {endCount === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ py: 2 }}>
          尚無比分
        </Typography>
      ) : Array.from({ length: endCount }, (_, index) => (
        <Paper
          key={index}
          variant="outlined"
          data-testid={`match-score-wave-${index + 1}`}
          sx={{
            display: "grid",
            gridTemplateAreas: { xs: '"wave" "side1" "side2"', md: '"side1 wave side2"' },
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(360px, 1fr) 72px minmax(360px, 1fr)" },
            gap: 0.75,
            minWidth: { md: 792 },
            mt: 1,
            p: 1,
          }}
        >
          <Stack sx={{ gridArea: "wave" }} alignItems="center" justifyContent="center">
            <WaveIcon index={index} />
            <Typography
              variant="subtitle2"
              sx={{ display: { xs: "block", md: "none" }, mt: 0.25 }}
            >
              第 {index + 1} 波
            </Typography>
          </Stack>
          <Box data-testid={`match-score-end-${index + 1}-side-1`} sx={{ gridArea: "side1", display: "flex", minWidth: 0, alignItems: "stretch" }}>
            <EndCell end={side1Ends[index]} otherEnd={side2Ends[index]} cumulativePoints={side1Cumulative[index]} onToggleConfirmation={onToggleConfirmation} onEditEnd={onEditEnd} isUpdating={updatingEndIds.includes(side1Ends[index]?.id ?? -1)} disabled={disabled} allowUnconfirm={allowUnconfirm} isCurrentEnd={currentEndIndex === index} sideLabel={side1.label} />
          </Box>
          <Box data-testid={`match-score-end-${index + 1}-side-2`} sx={{ gridArea: "side2", display: "flex", minWidth: 0, alignItems: "stretch" }}>
            <EndCell end={side2Ends[index]} otherEnd={side1Ends[index]} cumulativePoints={side2Cumulative[index]} onToggleConfirmation={onToggleConfirmation} onEditEnd={onEditEnd} isUpdating={updatingEndIds.includes(side2Ends[index]?.id ?? -1)} disabled={disabled} allowUnconfirm={allowUnconfirm} isCurrentEnd={currentEndIndex === index} sideLabel={side2.label} />
          </Box>
        </Paper>
      ))}
    </Paper>
  );
}
