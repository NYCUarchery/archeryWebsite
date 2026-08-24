"use client";
import GroupMenu from "../../../GroupMenu";
import { Alert, Box, Button, Autocomplete, Stack, TextField, Typography } from "@mui/material";
import { useAppSelector } from "store/hooks";
import { useEffect, useState } from "react";
import useGetCompetitionGroupsWithPlayers from "@/utils/QueryHooks/useGetCompetitionGroupsWithPlayers";
import { useMutation, useQueryClient } from "react-query";
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
  const [bracketError, setBracketError] = useState<string | null>(null);
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
      },
    }
  );

  const { mutate: rerankPlayerSet } = useMutation(
    () => {
      return apiClient.playerSet.prerankingPartialUpdate(
        elimination!.elimination_id!
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "playerSets",
          elimination!.elimination_id,
        ]);
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

  const group = groups?.[groupIndex];
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

  const handleReranking = () => {
    rerankPlayerSet();
  };

  useEffect(() => {
    if (params.teamSize === "1") {
      setSetName(selectedPlayers[0]?.label ?? "");
    }
  }, [selectedPlayers]);

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
        <Button
          variant="contained"
          onClick={() => createBracket()}
          disabled={!canCreateBracket || isBracketCreating}
        >
          {isBracketCreating ? "建立中…" : "建立完整對抗樹"}
        </Button>
      </Stack>
      <Button onClick={handleReranking} disabled={bracketExists}>
        更新排名
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
    </Box>
  );
}
