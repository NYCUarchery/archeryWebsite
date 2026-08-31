"use client";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Alert,
  Paper,
  Table,
  TableContainer,
  Box,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Stack,
} from "@mui/material";
import { useAppSelector } from "store/hooks";
import useGetPlayerSets from "@/utils/QueryHooks/useGetPlayerSets";
import useGetPlayerSetRanking from "@/utils/QueryHooks/useGetPlayerSetRanking";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import useGetPlayerSetDetail from "@/utils/QueryHooks/useGetPlayerSetDetail";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import { isBracketRosterLocked } from "@/utils/eliminationBracket";
import type { DatabasePlayerSetRanking } from "@/types/Api";

type RankingRow = Required<DatabasePlayerSetRanking>;

// 明確映射欄位並提供預設值，避免後端遺漏欄位時以 `as` 斷言靜默產生 undefined。
// id 為必要欄位，不提供預設值（後端理應永遠回傳）。
function toRankingRows(playerSets: DatabasePlayerSetRanking[] | undefined): RankingRow[] {
  return (playerSets ?? []).map((row) => ({
    id: row.id as number,
    rank: row.rank ?? 0,
    set_name: row.set_name ?? "",
    total_score: row.total_score ?? 0,
    x_count: row.x_count ?? 0,
    ten_count: row.ten_count ?? 0,
  }));
}

function SortablePlayerSetRow({
  row,
  index,
  dragDisabled,
  canDelete,
  onOpenDetail,
  onDeleteRequest,
}: {
  row: RankingRow;
  index: number;
  dragDisabled: boolean;
  canDelete: boolean;
  onOpenDetail: (id: number) => void;
  onDeleteRequest: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: dragDisabled });

  return (
    <TableRow
      ref={setNodeRef}
      sx={{
        backgroundColor: isDragging ? "action.hover" : undefined,
        opacity: isDragging ? 0.7 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TableCell align="center">
        <IconButton
          aria-label={`拖動 ${row.set_name} 排名`}
          disabled={dragDisabled}
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragHandleIcon />
        </IconButton>
      </TableCell>
      <TableCell align="center">{index + 1}</TableCell>
      <TableCell
        align="center"
        onClick={() => onOpenDetail(row.id)}
        sx={{ cursor: "pointer" }}
      >
        {row.set_name}
      </TableCell>
      <TableCell align="center">{row.total_score}</TableCell>
      <TableCell align="center">{row.x_count}</TableCell>
      <TableCell align="center">{row.ten_count}</TableCell>
      <TableCell align="center">
        {canDelete && (
          <IconButton onClick={() => onDeleteRequest(row.id)}>
            <DeleteIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function Page({
  params,
}: {
  params: { id: string; teamSize: string };
}) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerSetDialogOpen, setPlayerSetDialogOpen] = useState(false);
  const [playerSetId, setPlayerSetId] = useState<number | undefined>(undefined);
  const [setIdToDelete, setSetIdToDelete] = useState<number | null>(null);
  const groupIndex = useAppSelector((state) => state.schedule.groupIndex);
  const teamSize = parseInt(params.teamSize);
  const { data: elimination } = useGetElimination(
    parseInt(params.id),
    groupIndex - 1, // 0 is unassigned group in the for the group menu.
    teamSize
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { mutate: deletePlayerSet } = useMutation(
    (id: number) => apiClient.playerSet.playersetDelete(id),
    {
      onSuccess: () => {
        setDeleteError(null);
        queryClient.invalidateQueries([
          "playerSets",
          elimination!.elimination_id,
        ]);
        queryClient.invalidateQueries([
          "playerSetRanking",
          elimination!.elimination_id,
        ]);
        // 刪隊會令後端重算第一輪空位，須刷新含 bracket slot 的 detail。
        queryClient.invalidateQueries([
          "eliminationDetail",
          elimination!.elimination_id,
        ]);
      },
      onError: (error: any) => {
        setDeleteError(
          error?.response?.status === 409
            ? "已有對抗階段，無法刪除隊伍。"
            : "刪除隊伍失敗，請稍後再試。"
        );
      },
    }
  );
  const { isFetching: isPlayerSetFetching } = useGetPlayerSets(
    elimination?.elimination_id
  );
  const { data: eliminationDetail } = useGetEliminationDetail(
    elimination?.elimination_id
  );
  const rosterLocked = isBracketRosterLocked(eliminationDetail);
  const { data: playerSet } = useGetPlayerSetDetail(playerSetId);

  const {
    data: ranking,
    isLoading: isRankingLoading,
    error: rankingError,
    refetch: refetchRanking,
  } = useGetPlayerSetRanking(elimination?.elimination_id);

  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loadedRows, setLoadedRows] = useState<RankingRow[]>([]);
  const [rankingConflict, setRankingConflict] = useState(false);
  const [rankingSaveError, setRankingSaveError] = useState<string | null>(
    null
  );
  const [discardNoticeOpen, setDiscardNoticeOpen] = useState(false);
  const draftDirtyRef = useRef(false);
  const prevGroupTeamKeyRef = useRef(`${groupIndex}-${teamSize}`);
  const dndContextId = useId();

  const isDirty =
    rows.length === loadedRows.length &&
    rows.length > 0 &&
    rows.some((row, index) => row.id !== loadedRows[index]?.id);
  draftDirtyRef.current = isDirty;

  // Discard any unsaved draft when the selected group or team size changes.
  useEffect(() => {
    const key = `${groupIndex}-${teamSize}`;
    if (prevGroupTeamKeyRef.current === key) return;
    prevGroupTeamKeyRef.current = key;
    if (draftDirtyRef.current) {
      setDiscardNoticeOpen(true);
    }
    draftDirtyRef.current = false;
    setRows([]);
    setLoadedRows([]);
    setRankingConflict(false);
    setRankingSaveError(null);
  }, [groupIndex, teamSize]);

  // Sync local draft from the loaded ranking, unless there is an unsaved draft.
  useEffect(() => {
    if (!ranking) return;
    if (draftDirtyRef.current) return;
    const nextRows = toRankingRows(ranking.player_sets);
    setRows(nextRows);
    setLoadedRows(nextRows);
  }, [ranking]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { mutate: saveRanking, isLoading: isSavingRanking } = useMutation(
    () =>
      apiClient.playerSet.eliminationRankingPartialUpdate(
        elimination!.elimination_id!,
        {
          expected_player_set_ids: loadedRows.map((row) => row.id),
          player_set_ids: rows.map((row) => row.id),
        }
      ),
    {
      onSuccess: (response) => {
        const savedRows = response.data.player_sets
          ? toRankingRows(response.data.player_sets)
          : rows;
        setRows(savedRows);
        setLoadedRows(savedRows);
        setRankingConflict(false);
        setRankingSaveError(null);
        queryClient.invalidateQueries([
          "playerSets",
          elimination!.elimination_id,
        ]);
        queryClient.invalidateQueries([
          "playerSetRanking",
          elimination!.elimination_id,
        ]);
        // 重排成功後，後端已同步第一輪 seed；detail 使用 Infinity cache，
        // 不主動失效便會持續顯示舊 slot。
        queryClient.invalidateQueries([
          "eliminationDetail",
          elimination!.elimination_id,
        ]);
      },
      onError: (error: any) => {
        const status = error?.response?.status;
        if (status === 409) {
          queryClient.invalidateQueries([
            "eliminationDetail",
            elimination!.elimination_id,
          ]);
          const errorText = error?.response?.data?.error;
          if (
            typeof errorText === "string" &&
            errorText.includes("after bracket initialization")
          ) {
            setRankingConflict(false);
            setRankingSaveError("已有對抗階段，無法調整排名。");
            return;
          }
          setRankingConflict(true);
          setRankingSaveError(null);
          return;
        }
        setRankingConflict(false);
        setRankingSaveError(
          status === 403
            ? "您沒有更新此對抗賽排名的權限。"
            : status !== undefined && status >= 500
              ? "伺服器暫時無法儲存排名，請稍後再試。"
              : error?.response?.data?.error ?? "儲存排名失敗，草稿仍保留。"
        );
      },
    }
  );

  const rowCount = rows.length;
  const dragDisabled = rosterLocked || isSavingRanking || rowCount < 2;
  const rankingButtonsDisabled = rosterLocked || isSavingRanking || rowCount < 2;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (dragDisabled || !over || active.id === over.id) return;
    setRows((current) => {
      const oldIndex = current.findIndex((row) => row.id === active.id);
      const newIndex = current.findIndex((row) => row.id === over.id);
      return oldIndex === -1 || newIndex === -1
        ? current
        : arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleRestore = () => {
    draftDirtyRef.current = false;
    setRows(loadedRows);
    setRankingConflict(false);
    setRankingSaveError(null);
  };

  const handleReloadRanking = async () => {
    setRankingConflict(false);
    setRankingSaveError(null);
    const result = await refetchRanking();
    if (result.isError) {
      // react-query v3 keeps the previous `data` on a failed refetch, so
      // landing rows here would silently discard the draft and re-land the
      // stale pre-conflict order instead of surfacing the failure.
      setRankingConflict(true);
      setRankingSaveError("重新載入排名失敗，草稿仍保留。");
      return;
    }
    const next = toRankingRows(result.data?.player_sets);
    // Land the refetch result directly instead of relying on the [ranking]
    // sync effect: react-query v3's structural sharing can keep the same
    // `data` reference for a deep-equal response, so that effect may never
    // re-run after this refetch, leaving a stale draft/loadedRows behind.
    setRows(next);
    setLoadedRows(next);
  };

  const handleDelete = () => {
    deletePlayerSet(setIdToDelete!);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button
          variant="contained"
          onClick={() => saveRanking()}
          disabled={!isDirty || isSavingRanking || rankingButtonsDisabled}
        >
          {isSavingRanking ? "儲存中…" : "儲存排名"}
        </Button>
        <Button
          onClick={handleRestore}
          disabled={!isDirty || rankingButtonsDisabled}
        >
          還原
        </Button>
      </Stack>
      {rankingConflict && (
        <Alert
          action={
            <Button color="inherit" size="small" onClick={handleReloadRanking}>
              重新載入
            </Button>
          }
          severity="warning"
          sx={{ mb: 1 }}
        >
          名單或排名已變更；重新載入會捨棄目前草稿。
        </Alert>
      )}
      {rankingSaveError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {rankingSaveError}
        </Alert>
      )}
      {!!rankingError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {(rankingError as any)?.response?.status === 403
            ? "需要管理員權限才能檢視隊伍排名。"
            : "排名載入失敗，請稍後重試。"}
        </Alert>
      )}
      {deleteError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {deleteError}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell align="center">排名</TableCell>
              <TableCell align="center">隊名</TableCell>
              <TableCell align="center">隊伍總分</TableCell>
              <TableCell align="center">X</TableCell>
              <TableCell align="center">10</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <DndContext
              collisionDetection={closestCenter}
              id={dndContextId}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={rows.map((row) => row.id)}
                strategy={verticalListSortingStrategy}
              >
                {!isRankingLoading &&
                  rows.map((row, index) => (
                    <SortablePlayerSetRow
                      key={row.id}
                      row={row}
                      index={index}
                      dragDisabled={dragDisabled}
                      canDelete={!rosterLocked}
                      onOpenDetail={(id) => {
                        setPlayerSetId(id);
                        setPlayerSetDialogOpen(true);
                      }}
                      onDeleteRequest={(id) => {
                        setDeleteDialogOpen(true);
                        setSetIdToDelete(id);
                      }}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={discardNoticeOpen}
        autoHideDuration={4000}
        onClose={() => setDiscardNoticeOpen(false)}
        message="組別或隊伍人數已變更，未儲存的排名調整已被捨棄。"
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogContent>確定要刪除嗎？</DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              handleDelete();
              setDeleteDialogOpen(false);
              setSetIdToDelete(null);
            }}
          >
            確定
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setDeleteDialogOpen(false);
              setSetIdToDelete(null);
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={playerSetDialogOpen}
        onClose={() => setPlayerSetDialogOpen(false)}
      >
        <DialogContent>
          {isPlayerSetFetching ? (
            <></>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>排名</TableCell>
                  <TableCell>總分</TableCell>
                  <TableCell>姓名</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...(playerSet?.players ?? [])]
                  .sort((a, b) => a.rank! - b.rank!)
                  .map((player) => {
                    return (
                      <TableRow key={player.id}>
                        <TableCell>{player.rank}</TableCell>
                        <TableCell>{player.total_score}</TableCell>
                        <TableCell>{player.name}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setPlayerSetDialogOpen(false);
            }}
          >
            確定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
