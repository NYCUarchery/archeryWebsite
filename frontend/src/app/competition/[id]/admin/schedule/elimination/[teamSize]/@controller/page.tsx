"use client";
import GroupMenu from "../../../GroupMenu";
import { Box, Button, Autocomplete, TextField } from "@mui/material";
import { useAppSelector } from "store/hooks";
import { useEffect, useState } from "react";
import useGetCompetitionGroupsWithPlayers from "@/utils/QueryHooks/useGetCompetitionGroupsWithPlayers";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { EndpointPostPlayerSetPlayerSetData } from "@/types/Api";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";

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
  const [setName, setSetName] = useState<string>("");
  const { data: groups } = useGetCompetitionGroupsWithPlayers(
    parseInt(params.id)
  );
  const { data: elimination } = useGetElimination(
    parseInt(params.id),
    groupIndex - 1, // 0 is unassigned group in the for the group menu.
    parseInt(params.teamSize)
  );
  const [selectedPlayers, setSelectedPlayers] = useState<
    AutocompletePlayerValue[]
  >(Array(parseInt(params.teamSize)));
  const [inputValues, setInputValues] = useState<string[]>(
    Array(parseInt(params.teamSize)).fill("")
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

  const group = groups?.[groupIndex];
  const playerOptions =
    group?.players
      ?.sort((a, b) => a.rank! - b.rank!)
      .map((player) => ({
        value: player!.id,
        label: player!.name + " rank: " + player!.rank,
      })) ?? [];

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
      <Button onClick={handleReranking}>更新排名</Button>
      {Array(parseInt(params.teamSize))
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
        disabled={params.teamSize === "1"}
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        sx={{ width: "100%", mb: 2 }}
      />

      <Button variant="contained" onClick={handleCreatePlayerSet}>
        創建隊伍
      </Button>
    </Box>
  );
}
