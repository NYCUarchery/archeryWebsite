"use client";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  MenuItem,
  Select,
  TextField,
  Paper,
  DialogActions,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useMutation, useQueryClient } from "react-query";
import { useState } from "react";

import useGetCompetitionGroupsWithPlayers from "@/utils/QueryHooks/useGetCompetitionGroupsWithPlayers";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";

import GroupMenu from "../../GroupMenu";
import { useAppSelector } from "store/hooks";
import { apiClient } from "@/utils/ApiClient";
import {
  EndpointPostStagePostStageData,
  EndpointPostMatchMatchData,
} from "@/types/Api";
import LaneNumber from "@/components/LaneNumber";
import EliminationProgressControl from "./EliminationProgressControl";
import {
  hasEliminationMatchStarted,
  isBracketRosterLocked,
  isCompleteEliminationBracket,
} from "@/utils/eliminationBracket";
import {
  MatchPlacement,
  MatchTarget,
  getMatchResultTarget,
  isValidMatchPlacement,
  requiredTargetCount,
} from "@/utils/eliminationPlacement";
import {
  placeEliminationStage,
} from "@/utils/eliminationPlacementApi";

interface PlayerSetOption {
  id: number;
  label: string;
}

function Page({ params }: { params: { id: string; teamSize: string } }) {
  const queryClient = useQueryClient();
  const competitionId = parseInt(params.id);
  const teamSize = parseInt(params.teamSize);
  const [setOption1, setSetOption1] = useState<PlayerSetOption | null>(null);
  const [setOption2, setSetOption2] = useState<PlayerSetOption | null>(null);
  const [laneNumber1, setLaneNumber1] = useState<number>(0);
  const [laneNumber2, setLaneNumber2] = useState<number>(0);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);
  const [matchInfoDialogOpen, setMatchInfoDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [firstRoundSyncError, setFirstRoundSyncError] = useState<string | null>(
    null
  );
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [stagePlacementOpen, setStagePlacementOpen] = useState(false);
  const [stageToPlace, setStageToPlace] = useState<{
    id: number;
    matchCount: number;
  } | null>(null);
  const [placementStartLane, setPlacementStartLane] = useState(1);
  const [placementEndLane, setPlacementEndLane] = useState(1);
  const [placementMode, setPlacementMode] = useState<
    "one_player_set_per_target" | "two_player_sets_per_target"
  >("one_player_set_per_target");
  const [matchPlacements, setMatchPlacements] = useState<MatchPlacement[]>([]);
  const [initialPlayerSetIds, setInitialPlayerSetIds] = useState<
    [number | null, number | null] | null
  >(null);
  const [winnerMatchResultId, setWinnerMatchResultId] = useState<number | null>(
    null
  );

  const {
    data: competition,
    isLoading: isCompetitionLoading,
    isError: isCompetitionError,
  } = useGetCompetitionWithGroups(competitionId);
  const { data: groups } =
    useGetCompetitionGroupsWithPlayers(competitionId);

  const groupIndex = useAppSelector((state) => state.progress.groupIndex);
  const {
    data: elimination,
    isLoading: isEliminationLoading,
    isError: isEliminationError,
  } = useGetElimination(
    competitionId,
    groupIndex - 1, // 0 is unassigned group in the for the group menu.
    teamSize
  );
  const {
    data: eliminationDetail,
    isLoading: isEliminationDetailLoading,
    isError: isEliminationDetailError,
  } = useGetEliminationDetail(elimination?.elimination_id);
  const playerSets = eliminationDetail?.player_sets;

  const playerSetOptions: PlayerSetOption[] =
    playerSets?.map((set) => ({
      id: set.id!,
      label: set.set_name! + ` No.${set.rank}`,
    })) ?? [];

  const stages = eliminationDetail?.stages ?? [];
  const bracketExists = isCompleteEliminationBracket(eliminationDetail?.stages);
  const hasGeneratedBracket = (eliminationDetail?.bracket_seed_count ?? 0) > 0;
  const rosterLocked = isBracketRosterLocked(eliminationDetail);

  const { mutate: createStage } = useMutation(
    (data: EndpointPostStagePostStageData) =>
      apiClient.elimination.stageCreate(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "eliminationDetail",
          elimination?.elimination_id,
        ]);
      },
    }
  );
  const { mutate: createMatch } = useMutation(
    (data: EndpointPostMatchMatchData) =>
      apiClient.elimination.matchCreate(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "eliminationDetail",
          elimination?.elimination_id,
        ]);
        resetState();
      },
    }
  );

  const { mutate: advanceStage, isLoading: isStageAdvancing } = useMutation(
    (stageId: number) => apiClient.elimination.stageAdvanceCreate(stageId),
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
        queryClient.invalidateQueries([
          "eliminationProgress",
          elimination?.elimination_id,
        ]);
        queryClient.invalidateQueries([
          "playerSets",
          elimination?.elimination_id,
        ]);
        setAdvanceError(null);
      },
      onError: (error: any) => {
        setAdvanceError(
          error?.response?.data?.error ??
            "依賽果推進對抗賽失敗，請確認本階段賽果後再試。"
        );
      },
    }
  );

  const { mutate: syncFirstRound, isLoading: isFirstRoundSyncing } =
    useMutation(
      () => {
        if (elimination?.elimination_id === undefined) {
          throw new Error("尚未建立對抗賽");
        }
        return apiClient.elimination.bracketSyncFirstRoundCreate(
          elimination.elimination_id
        );
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries([
            "eliminationDetail",
            elimination?.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "playerSets",
            elimination?.elimination_id,
          ]);
          setFirstRoundSyncError(null);
        },
        onError: (error: any) => {
          setFirstRoundSyncError(
            error?.response?.data?.error ??
              "依排名填入第一階段失敗，請檢查隊伍排名。"
          );
        },
      }
    );

  const { mutate: saveStagePlacement, isLoading: isStagePlacementSaving } =
    useMutation(
      () => {
        if (!stageToPlace) throw new Error("尚未選擇階段");
        return placeEliminationStage(stageToPlace.id, {
          start_lane_number: placementStartLane,
          end_lane_number: placementEndLane,
          mode: placementMode,
        });
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries([
            "eliminationDetail",
            elimination?.elimination_id,
          ]);
          setPlacementError(null);
          setStagePlacementOpen(false);
        },
        onError: (error: any) => {
          setPlacementError(
            error?.response?.data?.error ??
              "設定本階段靶道失敗，請檢查靶道範圍。"
          );
        },
      }
    );

  const { mutate: saveMatchDialog, isLoading: isMatchDialogSaving } =
    useMutation(
      async () => {
        if (!selectedMatchId || !initialPlayerSetIds) {
          throw new Error("尚未選擇對抗組");
        }
        if (!isValidMatchPlacement(matchPlacements)) {
          throw new Error("靶道與靶面配置不合法");
        }

        const selectedPlayerSetIds: [number | null, number | null] = [
          setOption1?.id ?? null,
          setOption2?.id ?? null,
        ];
        const playerSetsChanged =
          selectedPlayerSetIds[0] !== initialPlayerSetIds[0] ||
          selectedPlayerSetIds[1] !== initialPlayerSetIds[1];

        if (playerSetsChanged) {
          if (
            selectedPlayerSetIds[0] === null ||
            selectedPlayerSetIds[1] === null ||
            selectedPlayerSetIds[0] === selectedPlayerSetIds[1]
          ) {
            throw new Error("更正隊伍時，兩個席位都必須指定不同隊伍");
          }
        }

        return apiClient.elimination.matchSettingsUpdate(selectedMatchId, {
          placements: matchPlacements,
          winner_match_result_id: winnerMatchResultId,
          ...(playerSetsChanged
            ? { player_set_ids: selectedPlayerSetIds as [number, number] }
            : {}),
        });
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries([
            "eliminationDetail",
            elimination?.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "playerSets",
            elimination?.elimination_id,
          ]);
          queryClient.invalidateQueries([
            "playerSetRanking",
            elimination?.elimination_id,
          ]);
          setPlacementError(null);
          handleMatchInfoDialogClose();
        },
        onError: (error: any) => {
          setPlacementError(
            error?.response?.data?.error ??
              "儲存對抗組失敗，請檢查資料後再試。"
          );
        },
      }
    );

  const {
    mutate: setEliminationProgress,
    isLoading: isProgressUpdating,
  } = useMutation(
    ({
      currentStage,
      currentEnd,
    }: {
      currentStage: number;
      currentEnd: number;
    }) => {
      if (elimination?.elimination_id === undefined) {
        throw new Error("Elimination 尚未建立");
      }
      return apiClient.elimination.progressPartialUpdate(
        elimination.elimination_id,
        {
          current_stage: currentStage,
          current_end: currentEnd,
        }
      );
    },
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
        queryClient.invalidateQueries([
          "eliminationProgress",
          elimination?.elimination_id,
        ]);
      },
      onError: () => {
        setProgressError("更新對抗賽進度失敗，請稍後再試。");
      },
    }
  );


  const isPhaseActive =
    teamSize === 1
      ? competition?.elimination_is_active
      : teamSize === 3
        ? competition?.team_elimination_is_active
        : teamSize === 2
          ? competition?.mixed_elimination_is_active
          : false;

  const progressControl = (
    <EliminationProgressControl
      elimination={eliminationDetail}
      teamSize={teamSize}
      isPhaseActive={isPhaseActive}
      isLoading={
        isCompetitionLoading ||
        isEliminationLoading ||
        isEliminationDetailLoading
      }
      isError={
        isCompetitionError || isEliminationError || isEliminationDetailError
      }
      isUpdating={isProgressUpdating}
      errorMessage={progressError}
      onDismissError={() => setProgressError(null)}
      onChange={(currentStage, currentEnd) =>
        setEliminationProgress({ currentStage, currentEnd })
      }
    />
  );

  if (!eliminationDetail) {
    return (
      <Box>
        <Card sx={{ p: 2 }}>
          <GroupMenu
            groupNames={groups?.map((group) => group.group_name!) ?? []}
          />
        </Card>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
            gap: 2,
            mt: 2,
          }}
        >
          <Card sx={{ p: 2, alignSelf: "start" }}>{progressControl}</Card>
        </Box>
      </Box>
    );
  }

  const resetState = () => {
    setCreateMatchDialogOpen(false);
    setSetOption1(null);
    setSetOption2(null);
    setLaneNumber1(0);
    setLaneNumber2(0);
  };

  const handleCreateStage = () => {
    createStage({
      elimination_id: elimination?.elimination_id,
    });
  };

  const handleCreateMatch = (
    stageId: number,
    set1_id: number,
    set2_id: number,
    laneNumber1: number,
    laneNumber2: number
  ) => {
    createMatch({
      lane_numbers: [laneNumber1, laneNumber2],
      player_set_ids: [set1_id, set2_id],
      stage_id: stageId,
    });
  };

  const handleMatchInfoDialogOpen = (
    match: {
      id?: number;
      match_results?: Array<{
        id?: number;
        player_set_id?: number;
        is_winner?: boolean;
        lane_number?: number;
        target?: MatchTarget;
      }>;
    },
    stageId: number
  ) => {
    if (!match.id || match.match_results?.length !== 2) return;

    const [result1, result2] = match.match_results;
    if (!result1 || !result2) return;
    const placements = match.match_results
      .filter(
        (
          result
        ): result is {
          id: number;
          lane_number?: number;
          target?: MatchTarget;
        } => result.id !== undefined
      )
      .map((result) => ({
        match_result_id: result.id,
        lane_number: result.lane_number ?? 0,
        target:
          result.target === "A" || result.target === "B" ? result.target : null,
      }));
    if (placements.length !== 2) return;

    const playerSetIds: [number | null, number | null] = [
      result1.player_set_id ?? null,
      result2.player_set_id ?? null,
    ];
    const winnerIds = match.match_results
      .filter((result): result is { id: number; is_winner?: boolean } =>
        result.id !== undefined
      )
      .filter((result) => result.is_winner)
      .map((result) => result.id);

    setSelectedMatchId(match.id);
    setSelectedStageId(stageId);
    setSetOption1(
      playerSetOptions.find((option) => option.id === result1.player_set_id) ??
        null
    );
    setSetOption2(
      playerSetOptions.find((option) => option.id === result2.player_set_id) ??
        null
    );
    setMatchPlacements(placements);
    setInitialPlayerSetIds(playerSetIds);
    setWinnerMatchResultId(winnerIds[0] ?? null);
    setPlacementError(null);
    setMatchInfoDialogOpen(true);
  };

  const handleMatchInfoDialogClose = () => {
    setMatchInfoDialogOpen(false);
    setSetOption1(null);
    setSetOption2(null);
    setSelectedMatchId(null);
    setSelectedStageId(null);
    setMatchPlacements([]);
    setInitialPlayerSetIds(null);
    setWinnerMatchResultId(null);
    setPlacementError(null);
  };

  const canCreateStage = () => {
    if (eliminationDetail?.stages?.length === 0) return true;
    const stageNum = stages.length;
    const advancingNum = eliminationDetail.stages![0].matchs!.length! * 2;
    const maxStageNum = Math.floor(Math.log2(advancingNum));
    return stageNum < maxStageNum;
  };

  const selectedSet1Detail = playerSets?.find(
    (set) => set.id === setOption1?.id
  );
  const selectedSet2Detail = playerSets?.find(
    (set) => set.id === setOption2?.id
  );
  const selectedMatch = stages
    .find((stage) => stage.id === selectedStageId)
    ?.matchs?.find((match) => match.id === selectedMatchId);
  const canAssignPlayerSets = selectedMatch !== undefined;
  const playerSetsChangedInDialog =
    initialPlayerSetIds !== null &&
    ((setOption1?.id ?? null) !== initialPlayerSetIds[0] ||
      (setOption2?.id ?? null) !== initialPlayerSetIds[1]);
  const showPlayerSetCorrectionWarning =
    playerSetsChangedInDialog &&
    (rosterLocked || hasEliminationMatchStarted(selectedMatch));

  const stagePlacementTargetCount = requiredTargetCount(
    stageToPlace?.matchCount ?? 0,
    placementMode
  );
  const placementPreviewEndLane =
    placementStartLane + stagePlacementTargetCount - 1;
  const isStagePlacementValid =
    placementStartLane >= 1 &&
    placementEndLane >= placementPreviewEndLane &&
    stagePlacementTargetCount > 0;

  const handleOpenStagePlacement = (stageId: number, matchCount: number) => {
    const defaultEndLane =
      placementStartLane +
      requiredTargetCount(matchCount, placementMode) -
      1;
    setStageToPlace({ id: stageId, matchCount });
    setPlacementEndLane(Math.max(1, defaultEndLane));
    setPlacementError(null);
    setStagePlacementOpen(true);
  };

  const updateMatchPlacement = (
    matchResultId: number,
    update: Partial<Pick<MatchPlacement, "lane_number" | "target">>
  ) => {
    setMatchPlacements((oldPlacements) =>
      oldPlacements.map((placement) =>
        placement.match_result_id === matchResultId
          ? { ...placement, ...update }
          : placement
      )
    );
  };

  return (
    <Box>
      <Card sx={{ p: 2 }}>
        <Stack direction="row">
          <GroupMenu
            groupNames={groups?.map((group) => group.group_name!) ?? []}
          />
          {!bracketExists && (
            <Button onClick={handleCreateStage} disabled={!canCreateStage()}>
              創建階段
            </Button>
          )}
        </Stack>
        {advanceError && (
          <Alert
            severity="error"
            sx={{ mt: 1 }}
            onClose={() => setAdvanceError(null)}
          >
            {advanceError}
          </Alert>
        )}
        {firstRoundSyncError && (
          <Alert
            severity="error"
            sx={{ mt: 1 }}
            onClose={() => setFirstRoundSyncError(null)}
          >
            {firstRoundSyncError}
          </Alert>
        )}
      </Card>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
          gap: 2,
          mt: 2,
          alignItems: "start",
        }}
      >
        <Card sx={{ p: 2 }}>{progressControl}</Card>
        <Card sx={{ p: 2, minWidth: 0, overflowX: "auto" }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              minWidth: "100%",
              width: "max-content",
            }}
          >
            {stages.map((stage, stageIndex) => {
              const isFinalStage = stageIndex === stages.length - 1;
              return (
                <Paper
                  key={stage.id}
                  sx={{ width: "300px", flexShrink: 0 }}
                >
                  {!bracketExists && (
                    <Button
                      onClick={() => {
                        setSelectedStageId(stage.id!);
                        setCreateMatchDialogOpen(true);
                      }}
                      sx={{ width: "100%" }}
                    >
                      創建對抗組
                    </Button>
                  )}
                  {hasGeneratedBracket && stageIndex === 0 && (
                    <Button
                      variant="outlined"
                      disabled={
                        !stage.id || rosterLocked || isFirstRoundSyncing
                      }
                      onClick={() => syncFirstRound()}
                      sx={{ width: "100%", mb: 1 }}
                    >
                      {isFirstRoundSyncing
                        ? "填入中…"
                        : "依排名填入第一階段"}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    disabled={!stage.id || isStageAdvancing}
                    onClick={() => advanceStage(stage.id!)}
                    sx={{ width: "100%", mb: 1 }}
                  >
                    {isFinalStage ? "依結果結算獎牌" : "依結果填入下一階段"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handleOpenStagePlacement(
                        stage.id!,
                        stage.matchs?.length ?? 0
                      )
                    }
                    disabled={
                      !stage.id ||
                      !(stage.matchs?.length) ||
                      isStagePlacementSaving
                    }
                    sx={{ width: "100%", mb: 1 }}
                  >
                    設定本階段靶道
                  </Button>
                  {stage.matchs?.map((match) => {
                    const result1 = match.match_results?.[0];
                    const result2 = match.match_results?.[1];
                    const set1 = playerSets?.find(
                      (set) => set.id === result1?.player_set_id
                    );
                    const set2 = playerSets?.find(
                      (set) => set.id === result2?.player_set_id
                    );
                    return (
                      <Paper
                        key={match.id}
                        onClick={() => handleMatchInfoDialogOpen(match, stage.id!)}
                        sx={{
                          cursor: match.id ? "pointer" : "default",
                          mb: 2,
                          ml: 2,
                          mr: 2,
                        }}
                      >
                        <Stack direction="row">
                          <LaneNumber
                            laneNumber={result1?.lane_number}
                            target={getMatchResultTarget(result1)}
                            width="30px"
                            height="30px"
                          />
                          <Typography
                            sx={{
                              flexGrow: 1,
                              lineHeight: "30px",
                              fontWeight: "bold",
                              mr: "30px",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <span>{set1?.set_name}</span>
                            {result1?.is_winner ? (
                              <EmojiEventsIcon sx={{ color: "#eee700" }} />
                            ) : null}
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          vs.
                        </Typography>
                        <Stack direction="row">
                          <LaneNumber
                            laneNumber={result2?.lane_number}
                            target={getMatchResultTarget(result2)}
                            width="30px"
                            height="30px"
                          />
                          <Typography
                            sx={{
                              flexGrow: 1,
                              lineHeight: "30px",
                              fontWeight: "bold",
                              mr: "30px",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <span>{set2?.set_name}</span>
                            {result2?.is_winner ? (
                              <EmojiEventsIcon sx={{ color: "#eee700" }} />
                            ) : null}
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Paper>
              );
            })}
          </Box>
        </Card>
      </Box>
      <Dialog open={createMatchDialogOpen}>
        <DialogTitle>創建對抗組</DialogTitle>
        <DialogContent>
          <Stack direction="row" sx={{ mt: 2 }}>
            <Autocomplete
              options={playerSetOptions}
              value={setOption1}
              onChange={(_, newValue) => setSetOption1(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="選擇選手" />
              )}
              sx={{ width: "80%", mr: 2 }}
            />
            <TextField
              value={laneNumber1}
              type="number"
              onChange={(e) => setLaneNumber1(parseInt(e.target.value))}
              sx={{ width: "20%" }}
            />
          </Stack>
          <Stack direction="row" sx={{ mt: 2 }}>
            <Autocomplete
              options={playerSetOptions}
              value={setOption2}
              onChange={(_, newValue) => setSetOption2(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="選擇選手" />
              )}
              sx={{ width: "80%", mr: 2 }}
            />
            <TextField
              value={laneNumber2}
              type="number"
              onChange={(e) => setLaneNumber2(parseInt(e.target.value))}
              sx={{ width: "20%" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="success"
            disabled={
              !setOption1 ||
              !setOption2 ||
              laneNumber1 === 0 ||
              laneNumber2 === 0
            }
            onClick={() =>
              handleCreateMatch(
                selectedStageId!,
                setOption1!.id!,
                setOption2!.id!,
                laneNumber1!,
                laneNumber2!
              )
            }
          >
            創建
          </Button>
          <Button color="error" onClick={resetState}>
            取消
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={matchInfoDialogOpen}
        onClose={() => !isMatchDialogSaving && handleMatchInfoDialogClose()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>修改對抗組</DialogTitle>
        <DialogContent sx={{ overflow: "visible" }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography>
              Match ID: <strong>{selectedMatchId}</strong>
            </Typography>
            <TextField
              select
              label="贏家"
              value={winnerMatchResultId ?? ""}
              onChange={(event) =>
                setWinnerMatchResultId(
                  event.target.value === "" ? null : Number(event.target.value)
                )
              }
              disabled={isMatchDialogSaving}
              size="small"
              fullWidth
            >
              <MenuItem value="">尚未指定</MenuItem>
              <MenuItem
                value={matchPlacements[0]?.match_result_id ?? ""}
                disabled={!setOption1 || !matchPlacements[0]}
              >
                隊伍 1：{setOption1?.label ?? "空席"}
              </MenuItem>
              <MenuItem
                value={matchPlacements[1]?.match_result_id ?? ""}
                disabled={!setOption2 || !matchPlacements[1]}
              >
                隊伍 2：{setOption2?.label ?? "空席"}
              </MenuItem>
            </TextField>
            <Paper sx={{ overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>隊伍</TableCell>
                    <TableCell>隊員</TableCell>
                    <TableCell>靶道</TableCell>
                    <TableCell>靶面</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    {
                      number: 1,
                      option: setOption1,
                      detail: selectedSet1Detail,
                      placement: matchPlacements[0],
                      setOption: setSetOption1,
                    },
                    {
                      number: 2,
                      option: setOption2,
                      detail: selectedSet2Detail,
                      placement: matchPlacements[1],
                      setOption: setSetOption2,
                    },
                  ].map(({ number, option, detail, placement, setOption }) => (
                    <TableRow key={number}>
                      <TableCell sx={{ width: "40%", minWidth: 200 }}>
                        <Autocomplete
                          options={playerSetOptions}
                          value={option}
                          onChange={(_, newValue) => setOption(newValue)}
                          disabled={!canAssignPlayerSets || isMatchDialogSaving}
                          size="small"
                          renderInput={(params) => (
                            <TextField {...params} label={`隊伍 ${number}`} />
                          )}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 110 }}>
                        <Stack spacing={0.25}>
                          {detail?.players?.map((player) => (
                            <Typography key={player.id} variant="body2">
                              {player.name}
                            </Typography>
                          )) ?? <Typography variant="body2">—</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ width: 110 }}>
                        {placement && (
                          <TextField
                            type="number"
                            value={placement.lane_number}
                            inputProps={{
                              min: 0,
                              "aria-label": `隊伍 ${number} 靶道`,
                            }}
                            onChange={(event) =>
                              updateMatchPlacement(placement.match_result_id, {
                                lane_number: Number(event.target.value),
                              })
                            }
                            disabled={isMatchDialogSaving}
                            size="small"
                            sx={{ width: 90 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ width: 100 }}>
                        {placement && (
                          <Select
                            size="small"
                            value={placement.target ?? ""}
                            inputProps={{
                              "aria-label": `隊伍 ${number} 靶面`,
                            }}
                            onChange={(event) =>
                              updateMatchPlacement(placement.match_result_id, {
                                target: (event.target.value || null) as MatchTarget,
                              })
                            }
                            disabled={isMatchDialogSaving}
                            sx={{ minWidth: 80 }}
                          >
                            <MenuItem value="">無</MenuItem>
                            <MenuItem value="A">A</MenuItem>
                            <MenuItem value="B">B</MenuItem>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Typography variant="body2" color="text.secondary">
              合法：不同靶道且無靶面；同靶道且靶面 A/B 各一；或兩方皆為 0／無。
            </Typography>
            {showPlayerSetCorrectionWarning && (
              <Alert severity="warning">
                救援更正隊伍會保留該格既有比分與勝方；系統將同步後續賽程。
              </Alert>
            )}
            {!isValidMatchPlacement(matchPlacements) && (
              <Alert severity="error">靶道與靶面配置不合法。</Alert>
            )}
            {placementError && <Alert severity="error">{placementError}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            onClick={() => saveMatchDialog()}
            disabled={!isValidMatchPlacement(matchPlacements) || isMatchDialogSaving}
          >
            {isMatchDialogSaving ? "儲存中…" : "儲存"}
          </Button>
          <Button
            color="info"
            onClick={handleMatchInfoDialogClose}
            disabled={isMatchDialogSaving}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={stagePlacementOpen}
        onClose={() => !isStagePlacementSaving && setStagePlacementOpen(false)}
      >
        <DialogTitle>設定本階段靶道</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="起始靶道"
              type="number"
              value={placementStartLane}
              inputProps={{ min: 1 }}
              onChange={(event) => setPlacementStartLane(Number(event.target.value))}
            />
            <TextField
              label="結束靶道"
              type="number"
              value={placementEndLane}
              inputProps={{ min: 1 }}
              onChange={(event) => setPlacementEndLane(Number(event.target.value))}
            />
            <Select
              value={placementMode}
              onChange={(event) =>
                setPlacementMode(
                  event.target.value as
                    | "one_player_set_per_target"
                    | "two_player_sets_per_target"
                )
              }
            >
              <MenuItem value="one_player_set_per_target">
                每靶道一隊
              </MenuItem>
              <MenuItem value="two_player_sets_per_target">
                每靶道兩隊（靶面 A/B）
              </MenuItem>
            </Select>
            <Typography>
              容量至少 {stagePlacementTargetCount} 個靶道；實際將使用靶道 {placementStartLane}–{placementPreviewEndLane}。
            </Typography>
            {placementEndLane < placementPreviewEndLane && (
              <Alert severity="error">
                結束靶道不足，至少需到 {placementPreviewEndLane}。
              </Alert>
            )}
            {placementError && <Alert severity="error">{placementError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStagePlacementOpen(false)}
            disabled={isStagePlacementSaving}
          >
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => saveStagePlacement()}
            disabled={!isStagePlacementValid || isStagePlacementSaving}
          >
            {isStagePlacementSaving ? "儲存中…" : "套用"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Page;
