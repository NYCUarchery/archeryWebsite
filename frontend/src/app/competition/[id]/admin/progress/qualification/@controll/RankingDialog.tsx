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
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { apiClient } from "@/utils/ApiClient";
import { Competition, Group } from "@/types/oldRef/Competition";
import type { DatabaseGroupRankingPlayer } from "@/types/Api";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

type RankingPlayer = Required<DatabaseGroupRankingPlayer>;

interface Props {
  competition: Competition;
  open: boolean;
  onClose: () => void;
  onNotification: (message: string, severity: "success" | "error") => void;
}

function SortablePlayerRow({
  player,
  rank,
  disabled,
}: {
  player: RankingPlayer;
  rank: number;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, disabled });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        alignItems: "center",
        backgroundColor: isDragging ? "action.hover" : "background.paper",
        borderRadius: 1,
        display: "grid",
        gridTemplateColumns: "44px minmax(120px, 1fr) 76px 54px 64px 44px",
        gap: 1,
        minHeight: 52,
        opacity: isDragging ? 0.7 : 1,
        px: 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Typography align="center" fontWeight={700}>{rank}</Typography>
      <Typography noWrap>{player.name}</Typography>
      <Typography align="right">{player.total_score}</Typography>
      <Typography align="right">{player.x_count}</Typography>
      <Typography align="right">{player.ten_count}</Typography>
      <IconButton
        aria-label={`拖動 ${player.name} 排名`}
        disabled={disabled}
        {...attributes}
        {...listeners}
        sx={{ cursor: "grab", touchAction: "none" }}
      >
        <DragHandleIcon />
      </IconButton>
    </Box>
  );
}

export default function RankingDialog({
  competition,
  open,
  onClose,
  onNotification,
}: Props) {
  const isSmallScreen = useMediaQuery("(max-width:600px)");
  const queryClient = useQueryClient();
  const formalGroups = useMemo(
    () =>
      (competition.groups ?? []).filter(
        (group) => group.id !== competition.unassigned_group_id
      ),
    [competition.groups, competition.unassigned_group_id]
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [expectedPlayerIds, setExpectedPlayerIds] = useState<number[]>([]);
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [pendingGroupId, setPendingGroupId] = useState<number | null>(null);
  const [rankingConflict, setRankingConflict] = useState(false);
  const draftDirtyRef = useRef(false);
  const dndContextId = useId();

  const selectedGroup = formalGroups.find(
    (group) => group.id === selectedGroupId
  ) as Group | undefined;
  const queryKey = ["groupPlayersRanking", selectedGroupId];
  const { isLoading, isFetching, error, refetch } = useQuery(
    queryKey,
    () => apiClient.groupinfo.playersRankingDetail(selectedGroupId ?? -1),
    {
      enabled: open && selectedGroupId !== null,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      select: (response) => response.data,
      onSuccess: (data) => {
        if (draftDirtyRef.current) return;
        setRankingConflict(false);
        const nextPlayers = (data.players ?? []) as RankingPlayer[];
        setPlayers(nextPlayers);
        setExpectedPlayerIds(nextPlayers.map((player) => player.id));
      },
    }
  );

  useEffect(() => {
    if (open && selectedGroupId === null) {
      setSelectedGroupId(formalGroups[0]?.id ?? null);
    }
  }, [formalGroups, open, selectedGroupId]);

  const isDirty =
    players.length === expectedPlayerIds.length &&
    players.some((player, index) => player.id !== expectedPlayerIds[index]);
  draftDirtyRef.current = isDirty;
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const invalidateRankingViews = (groupId: number) => {
    queryClient.invalidateQueries(["groupPlayersRanking"]);
    queryClient.invalidateQueries(["groupPlayersRanking", groupId]);
    queryClient.invalidateQueries(["groupinfoPlayersDetail"]);
    queryClient.invalidateQueries(["qualificationPlayersDetail"]);
    queryClient.invalidateQueries(["qualification", groupId]);
    queryClient.invalidateQueries(["qualificationLanes"]);
    queryClient.invalidateQueries(["competitionWithGroups", competition.id]);
    queryClient.invalidateQueries(["competitionGroupsPlayersDetail", competition.id]);
  };

  const { mutate: saveRanking, isLoading: isSaving } = useMutation(
    () =>
      apiClient.groupinfo.playersRankingPartialUpdate(selectedGroupId ?? -1, {
        expected_player_ids: expectedPlayerIds,
        player_ids: players.map((player) => player.id),
      }),
    {
      onSuccess: (response) => {
        const savedPlayers = (response.data.players ?? players) as RankingPlayer[];
        setPlayers(savedPlayers);
        setExpectedPlayerIds(savedPlayers.map((player) => player.id));
        if (selectedGroupId !== null) {
          invalidateRankingViews(selectedGroupId);
        }
        onNotification("手動排名已儲存", "success");
        onClose();
      },
      onError: (requestError: unknown) => {
        const status = (requestError as { response?: { status?: number } })
          ?.response?.status;
        setRankingConflict(status === 409);
        onNotification(
          status === 409
            ? "名單或排名已變更，請重新載入後再調整"
            : "手動排名儲存失敗，草稿仍保留",
          "error"
        );
      },
    }
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (isSaving || !over || active.id === over.id) return;
    setPlayers((currentPlayers) => {
      const oldIndex = currentPlayers.findIndex((player) => player.id === active.id);
      const newIndex = currentPlayers.findIndex((player) => player.id === over.id);
      return oldIndex === -1 || newIndex === -1
        ? currentPlayers
        : arrayMove(currentPlayers, oldIndex, newIndex);
    });
  };

  const finishClose = () => {
    draftDirtyRef.current = false;
    setDiscardDialogOpen(false);
    setPendingGroupId(null);
    setRankingConflict(false);
    setSelectedGroupId(null);
    setPlayers([]);
    setExpectedPlayerIds([]);
    onClose();
  };

  const requestClose = () => {
    if (isSaving) return;
    if (isDirty) {
      setPendingGroupId(null);
      setDiscardDialogOpen(true);
      return;
    }
    finishClose();
  };

  const requestGroupChange = (nextGroupId: number) => {
    if (isSaving || nextGroupId === selectedGroupId) return;
    if (isDirty) {
      setPendingGroupId(nextGroupId);
      setDiscardDialogOpen(true);
      return;
    }
    draftDirtyRef.current = false;
    setRankingConflict(false);
    setPlayers([]);
    setExpectedPlayerIds([]);
    setSelectedGroupId(nextGroupId);
  };

  const discardChanges = () => {
    setDiscardDialogOpen(false);
    if (pendingGroupId !== null) {
      draftDirtyRef.current = false;
      setRankingConflict(false);
      setPlayers([]);
      setExpectedPlayerIds([]);
      setSelectedGroupId(pendingGroupId);
      setPendingGroupId(null);
      return;
    }
    finishClose();
  };

  const reloadRanking = () => {
    draftDirtyRef.current = false;
    setRankingConflict(false);
    setPlayers([]);
    setExpectedPlayerIds([]);
    refetch();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        fullWidth
        maxWidth="md"
        fullScreen={isSmallScreen}
      >
        <DialogTitle>手動調整資格賽排名</DialogTitle>
        <DialogContent dividers sx={{ minHeight: "60vh" }}>
          <Stack spacing={2}>
            <Alert severity="info">自動更新排名將覆寫手動調整結果。</Alert>
            {rankingConflict && (
              <Alert
                action={<Button color="inherit" size="small" onClick={reloadRanking}>重新載入</Button>}
                severity="warning"
              >
                名單或排名已變更；重新載入會捨棄目前草稿。
              </Alert>
            )}
            <FormControl fullWidth disabled={formalGroups.length === 0 || isSaving}>
              <InputLabel id="manual-ranking-group-label">正式組別</InputLabel>
              <Select
                labelId="manual-ranking-group-label"
                label="正式組別"
                value={selectedGroupId ?? ""}
                onChange={(event) => requestGroupChange(Number(event.target.value))}
              >
                {formalGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedGroup && (
              <Typography color="text.secondary" variant="body2">
                拖動右側把手調整「{selectedGroup.group_name}」的名次；儲存前不會寫入資料。
              </Typography>
            )}
            {isLoading || isFetching ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">排名載入失敗，請稍後重試。</Alert>
            ) : formalGroups.length === 0 ? (
              <Alert severity="info">此賽事尚無正式組別。</Alert>
            ) : (
              <Box>
                <Box
                  sx={{
                    color: "text.secondary",
                    display: "grid",
                    fontSize: 14,
                    gridTemplateColumns: "44px minmax(120px, 1fr) 76px 54px 64px 44px",
                    gap: 1,
                    px: 1,
                    py: 1,
                  }}
                >
                  <Box textAlign="center">名次</Box>
                  <Box>姓名</Box>
                  <Box textAlign="right">總分</Box>
                  <Box textAlign="right">X</Box>
                  <Box textAlign="right">10</Box>
                  <Box />
                </Box>
                <Divider />
                <DndContext
                  collisionDetection={closestCenter}
                  id={dndContextId}
                  onDragEnd={handleDragEnd}
                  sensors={sensors}
                >
                  <SortableContext
                    items={players.map((player) => player.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {players.length === 0 ? (
                      <Typography color="text.secondary" sx={{ py: 4 }} textAlign="center">
                        此組別尚無選手。
                      </Typography>
                    ) : (
                      players.map((player, index) => (
                        <SortablePlayerRow
                          key={player.id}
                          disabled={isSaving}
                          player={player}
                          rank={index + 1}
                        />
                      ))
                    )}
                  </SortableContext>
                </DndContext>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={requestClose} disabled={isSaving}>取消</Button>
          <Button
            disabled={!isDirty || isSaving || selectedGroupId === null}
            onClick={() => saveRanking()}
            variant="contained"
          >
            {isSaving ? "儲存中…" : "儲存排名"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={discardDialogOpen} onClose={() => setDiscardDialogOpen(false)}>
        <DialogTitle>捨棄未儲存的調整？</DialogTitle>
        <DialogContent>
          <DialogContentText>目前的拖曳調整尚未儲存，離開或切換組別會捨棄這些變更。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialogOpen(false)}>繼續編輯</Button>
          <Button color="error" onClick={discardChanges}>捨棄變更</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
