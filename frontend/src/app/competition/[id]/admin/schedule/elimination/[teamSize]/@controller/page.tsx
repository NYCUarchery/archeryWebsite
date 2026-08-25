"use client";
import GroupMenu from "../../../GroupMenu";
import {
  Alert,
  Box,
  Button,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAppSelector } from "store/hooks";
import { useEffect, useState } from "react";
import useGetCompetitionGroupsWithPlayers from "@/utils/QueryHooks/useGetCompetitionGroupsWithPlayers";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { EndpointPostPlayerSetPlayerSetData } from "@/types/Api";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import useGetPlayerSets from "@/utils/QueryHooks/useGetPlayerSets";
import {
  hasContinuousRanks,
  isCompleteEliminationBracket,
  nextPowerOfTwo,
} from "@/utils/eliminationBracket";

type AutocompletePlayerValue = {
  label: string | undefined;
  value: number | undefined;
} | null;

export default function Page({
  params,
}: {
  params: { id: string; teamSize: string };
}) {
  const queryClient = useQueryClient();
  const groupIndex = useAppSelector((state) => state.schedule.groupIndex);
  const competitionId = parseInt(params.id);
  const teamSize = parseInt(params.teamSize);
  const [setName, setSetName] = useState<string>("");
  const { data: groups } =
    useGetCompetitionGroupsWithPlayers(competitionId);
  const { data: elimination } = useGetElimination(
    competitionId,
    groupIndex - 1, // 0 is unassigned group in the for the group menu.
    teamSize
  );
  const { data: eliminationDetail } = useGetEliminationDetail(
    elimination?.elimination_id
  );
  const { data: playerSets, isLoading: isPlayerSetsLoading } = useGetPlayerSets(
    elimination?.elimination_id
  );
  const group = groups?.[groupIndex];
  const { data: qualification, isLoading: isQualificationLoading } = useQuery(
    ["qualificationDetail", group?.id],
    () => apiClient.qualification.qualificationDetail(group!.id!),
    {
      select: (data) => data.data,
      enabled: teamSize === 1 && group?.id !== undefined,
      staleTime: 0,
    }
  );
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null);
  const [autoCreateCount, setAutoCreateCount] = useState<string>("");
  const [autoCreateDialogOpen, setAutoCreateDialogOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<
    AutocompletePlayerValue[]
  >(Array(teamSize));
  const [inputValues, setInputValues] = useState<string[]>(
    Array(teamSize).fill("")
  );
  const { mutate: createPlayerSet } = useMutation(
    (data: EndpointPostPlayerSetPlayerSetData) => {
      return apiClient.playerSet.playersetCreate(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "playerSets",
          elimination!.elimination_id,
        ]);
        queryClient.invalidateQueries([
          "playerSetRanking",
          elimination!.elimination_id,
        ]);
      },
    }
  );

  const [autoRankingError, setAutoRankingError] = useState<string | null>(
    null
  );

  const { mutate: autoRankPlayerSets, isLoading: isAutoRanking } =
    useMutation(
      () => {
        return apiClient.playerSet.eliminationRankingAutoPartialUpdate(
          elimination!.elimination_id!
        );
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries([
            "playerSetRanking",
            elimination!.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "playerSets",
            elimination!.elimination_id,
          ]);
          setAutoRankingError(null);
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          setAutoRankingError(
            status === 403
              ? "您沒有更新此對抗賽排名的權限。"
              : status === 409
                ? "已有對抗階段，未更新排名。"
                : status !== undefined && status >= 500
                  ? "伺服器暫時無法更新排名，請稍後再試。"
                  : error?.response?.data?.error ??
                    "自動更新排名失敗，請稍後再試。"
          );
        },
      }
    );

  const { mutate: autoCreatePlayerSets, isLoading: isAutoCreating } =
    useMutation(
      (count: number) =>
        apiClient.playerSet.eliminationAutoCreate(
          elimination!.elimination_id!,
          { count }
        ),
      {
        onSuccess: () => {
          queryClient.invalidateQueries([
            "playerSets",
            elimination!.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "playerSetRanking",
            elimination!.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "eliminationDetail",
            elimination!.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "competitionEliminations",
            competitionId,
          ]);
          setAutoCreateError(null);
          setAutoCreateDialogOpen(false);
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          setAutoCreateError(
            status === 400
              ? "建立人數必須介於 4 與可排名選手數之間，且資格排名必須連續。"
              : status === 403
                ? "您沒有建立此對抗賽隊伍的權限。"
                : status === 409
                  ? "已有對抗階段或既有隊伍與資格排名不相容，未覆寫既有資料。"
                  : status !== undefined && status >= 500
                    ? "伺服器暫時無法建立隊伍，請稍後再試。"
                    : error?.response?.data?.error ??
                      "自動建立隊伍失敗，請稍後再試。"
          );
        },
      }
    );

  const { mutate: createBracket, isLoading: isBracketCreating } = useMutation(
    () => apiClient.elimination.bracketCreate(elimination!.elimination_id!),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "eliminationDetail",
          elimination?.elimination_id,
        ]);
        queryClient.invalidateQueries([
          "competitionEliminations",
          competitionId,
        ]);
        setBracketError(null);
      },
      onError: (error: any) => {
        setBracketError(
          error?.response?.status === 409
            ? "已有部分或不相容賽程，未覆寫既有資料。"
            : error?.response?.data?.error ?? "建立完整對抗樹失敗，請稍後再試。"
        );
      },
    }
  );

  const playerOptions = [...(group?.players ?? [])]
    .sort((a, b) => a.rank! - b.rank!)
    .map((player) => ({
      value: player!.id,
      label: player!.name + " rank: " + player!.rank,
    }));
  const sortedPlayerSets = [...(playerSets ?? [])].sort(
    (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)
  );
  const playerSetCount = sortedPlayerSets.length;
  const bracketExists = isCompleteEliminationBracket(eliminationDetail?.stages);
  const stageExists = (eliminationDetail?.stages?.length ?? 0) > 0;
  const eligiblePlayerCount = (group?.players ?? []).filter(
    (player) => (player.rank ?? -1) >= 1
  ).length;
  const parsedAutoCreateCount = Number(autoCreateCount);
  const isAutoCreateCountValid =
    Number.isInteger(parsedAutoCreateCount) &&
    parsedAutoCreateCount >= 4 &&
    parsedAutoCreateCount <= eligiblePlayerCount;
  const canCreateBracket =
    !bracketExists &&
    !isPlayerSetsLoading &&
    playerSetCount >= 4 &&
    hasContinuousRanks(sortedPlayerSets);

  const handleCreatePlayerSet = () => {
    const playerIds = selectedPlayers.map((player) => player?.value);
    if (playerIds.includes(undefined)) {
      return;
    }
    createPlayerSet({
      elimination_id: elimination!.elimination_id,
      player_ids: playerIds as number[],
      set_name: setName,
    });
  };

  const handleAutoRanking = () => {
    autoRankPlayerSets();
  };

  const handleOpenAutoCreateDialog = () => {
    if (!isAutoCreateCountValid) {
      setAutoCreateError("建立人數必須介於 4 與目前可排名選手數之間。");
      return;
    }
    setAutoCreateError(null);
    setAutoCreateDialogOpen(true);
  };

  useEffect(() => {
    if (params.teamSize === "1") {
      setSetName(selectedPlayers[0]?.label ?? "");
    }
  }, [selectedPlayers]);

  useEffect(() => {
    if (qualification?.advancing_num !== undefined) {
      setAutoCreateCount(String(qualification.advancing_num));
    }
  }, [qualification?.id, qualification?.advancing_num]);

  return (
    <Box sx={{ width: "100%" }}>
      <GroupMenu groupNames={groups?.map((group) => group.group_name!) ?? []} />
      <Stack spacing={1} sx={{ my: 2 }}>
        <Typography>隊數：{playerSetCount}</Typography>
        <Typography>
          下一個 2 的冪：{nextPowerOfTwo(playerSetCount) || "—"}
        </Typography>
        <Typography>
          建立狀態：{bracketExists ? "完整對抗樹已建立" : "尚未建立完整對抗樹"}
        </Typography>
        {!isPlayerSetsLoading && playerSetCount < 4 && (
          <Alert severity="info">至少需要 4 隊才能建立完整對抗樹。</Alert>
        )}
        {!isPlayerSetsLoading &&
          playerSetCount >= 4 &&
          !hasContinuousRanks(sortedPlayerSets) && (
            <Alert severity="warning">隊伍排名必須連續且從 1 開始。</Alert>
          )}
        {bracketError && <Alert severity="error">{bracketError}</Alert>}
        {teamSize === 1 && (
          <>
            <Typography variant="subtitle1">依資格排名自動建立隊伍</Typography>
            <Typography variant="body2">
              可排名選手數：{eligiblePlayerCount}
            </Typography>
            {stageExists && (
              <Alert severity="info">已有對抗階段，不能再自動建立隊伍。</Alert>
            )}
            {autoCreateError && <Alert severity="error">{autoCreateError}</Alert>}
            <TextField
              label="建立人數"
              type="number"
              value={autoCreateCount}
              onChange={(event) => setAutoCreateCount(event.target.value)}
              inputProps={{ min: 4, max: eligiblePlayerCount, step: 1 }}
              helperText={
                isQualificationLoading
                  ? "正在載入資格賽設定…"
                  : "將依目前儲存的資格排名選取前 N 名。"
              }
              disabled={
                isQualificationLoading ||
                qualification === undefined ||
                stageExists ||
                isAutoCreating
              }
            />
            <Button
              variant="contained"
              onClick={handleOpenAutoCreateDialog}
              disabled={
                isQualificationLoading ||
                qualification === undefined ||
                elimination?.elimination_id === undefined ||
                stageExists ||
                isAutoCreating ||
                !isAutoCreateCountValid
              }
            >
              {isAutoCreating ? "建立中…" : "依資格排名建立隊伍"}
            </Button>
          </>
        )}
        <Button
          variant="contained"
          onClick={() => createBracket()}
          disabled={!canCreateBracket || isBracketCreating}
        >
          {isBracketCreating ? "建立中…" : "建立完整對抗樹"}
        </Button>
      </Stack>
      <Alert severity="info" sx={{ mt: 2 }}>
        自動更新排名將覆寫手動調整結果。右側未儲存的拖曳調整將失效，需重新載入。
      </Alert>
      {autoRankingError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {autoRankingError}
        </Alert>
      )}
      <Button
        onClick={handleAutoRanking}
        disabled={
          stageExists ||
          isAutoRanking ||
          elimination?.elimination_id === undefined
        }
      >
        {isAutoRanking ? "更新中…" : "自動更新排名"}
      </Button>
      {Array(teamSize)
        .fill(null)
        .map((_, index) => {
          return (
            <Autocomplete
              key={index}
              sx={{ mb: 2 }}
              options={playerOptions}
              id="player-select"
              value={selectedPlayers[index]}
              inputValue={inputValues[index]}
              disabled={bracketExists}
              onChange={(_: any, newValue: AutocompletePlayerValue) => {
                setSelectedPlayers((oldValue) => {
                  const newValues = [...oldValue];
                  newValues[index] = newValue;
                  return newValues;
                });
              }}
              onInputChange={(_: any, newInputValue: string) =>
                setInputValues((oldValue) => {
                  const newValues = [...oldValue];
                  newValues[index] = newInputValue;
                  return newValues;
                })
              }
              renderInput={(params: any) => (
                <TextField {...params} label="選手姓名" />
              )}
            ></Autocomplete>
          );
        })}

      <TextField
        disabled={params.teamSize === "1" || bracketExists}
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        sx={{ width: "100%", mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleCreatePlayerSet}
        disabled={bracketExists}
      >
        創建隊伍
      </Button>
      <Dialog
        open={autoCreateDialogOpen}
        onClose={() => !isAutoCreating && setAutoCreateDialogOpen(false)}
      >
        <DialogTitle>依資格排名建立隊伍</DialogTitle>
        <DialogContent>
          將依目前儲存的資格排名建立前 {parsedAutoCreateCount} 名隊伍，確定要繼續嗎？
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAutoCreateDialogOpen(false)}
            disabled={isAutoCreating}
          >
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => autoCreatePlayerSets(parsedAutoCreateCount)}
            disabled={isAutoCreating}
          >
            {isAutoCreating ? "建立中…" : "確認建立"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
