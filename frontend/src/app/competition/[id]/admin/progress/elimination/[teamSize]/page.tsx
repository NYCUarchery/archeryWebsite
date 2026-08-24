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
  DatabasePlayerSet,
} from "@/types/Api";
import LaneNumber from "@/components/LaneNumber";
import EliminationProgressControl from "./EliminationProgressControl";
import { isCompleteEliminationBracket } from "@/utils/eliminationBracket";

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
  const [set1Detail, setSet1Detail] = useState<DatabasePlayerSet | null>(null);
  const [set2Detail, setSet2Detail] = useState<DatabasePlayerSet | null>(null);
  const [laneNumber1, setLaneNumber1] = useState<number>(0);
  const [laneNumber2, setLaneNumber2] = useState<number>(0);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);
  const [matchInfoDialogOpen, setMatchInfoDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

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

  const { mutate: updateIsWinner } = useMutation(
    (data: any) =>
      apiClient.matchResult.iswinnerPartialUpdate(data.id, data.matchResult),
    {
      onSuccess: (_, variables) => {
        if (!eliminationDetail?.stages) return;

        const stage = eliminationDetail.stages.find(
          (stage) => stage.id === selectedStageId
        );
        if (!stage?.matchs) return;

        const match = stage.matchs.find(
          (match) => match.id === selectedMatchId
        );
        if (!match?.match_results) return;

        const result = match.match_results.find(
          (result) => result.id === variables.id
        );
        if (result) {
          result.is_winner = variables.matchResult.is_winner;
        }
      },
    }
  );
  const { mutate: updateLaneNumber } = useMutation(
    (data: any) =>
      apiClient.matchResult.lanenumberPartialUpdate(data.id, data.matchResult),
    {
      onSuccess: (_, variables) => {
        if (!eliminationDetail?.stages) return;

        const stage = eliminationDetail.stages.find(
          (stage) => stage.id === selectedStageId
        );
        if (!stage?.matchs) return;

        const match = stage.matchs.find(
          (match) => match.id === selectedMatchId
        );
        if (!match?.match_results) return;

        const result = match.match_results.find(
          (result) => result.id === variables.id
        );
        if (result) {
          result.lane_number = variables.matchResult.lane_number;
        }
      },
    }
  );

  const { mutate: updatePlayerSets } = useMutation(
    (data: { matchId: number; playerSetIds: { player_set_ids: number[] } }) =>
      apiClient.elimination.matchPlayersetPartialUpdate(
        data.matchId,
        data.playerSetIds
      ),
    {
      onSuccess: (_, variables) => {
        const match = eliminationDetail?.stages
          ?.flatMap((stage) => stage.matchs)
          ?.find((match) => match!.id === variables.matchId);
        match!.match_results![0].player_set_id =
          variables.playerSetIds.player_set_ids[0];
        match!.match_results![1].player_set_id =
          variables.playerSetIds.player_set_ids[1];
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
    matchId: number,
    stageId: number,
    set1: DatabasePlayerSet,
    set2: DatabasePlayerSet
  ) => {
    setSelectedMatchId(matchId);
    setSelectedStageId(stageId);
    const option1 = playerSetOptions.find((option) => option.id === set1.id);
    const option2 = playerSetOptions.find((option) => option.id === set2.id);
    setSet1Detail(set1);
    setSet2Detail(set2);
    setSetOption1(option1!);
    setSetOption2(option2!);
    setMatchInfoDialogOpen(true);
  };

  const handleMatchInfoDialogClose = () => {
    setMatchInfoDialogOpen(false);
    setSetOption1(null);
    setSetOption2(null);
    setSelectedMatchId(null);
    setSelectedStageId(null);
  };

  const handleUpdateIsWinner = (matchResultId: number, isWinner: boolean) => {
    updateIsWinner({
      id: matchResultId,
      matchResult: { is_winner: isWinner },
    });
  };

  const getWinnerButton1 = () => {
    const match = eliminationDetail?.stages
      ?.find((stage) => stage.id === selectedStageId)
      ?.matchs?.find((match) => match.id === selectedMatchId);
    const result1 = match?.match_results?.[0];
    const isWinner = result1?.is_winner;
    return (
      <Button
        onClick={() => handleUpdateIsWinner(result1!.id!, !result1!.is_winner)}
        color={isWinner ? "success" : "info"}
      >
        {isWinner ? "是" : "否"}
      </Button>
    );
  };

  const getWinnerButton2 = () => {
    const match = eliminationDetail?.stages
      ?.find((stage) => stage.id === selectedStageId)
      ?.matchs?.find((match) => match.id === selectedMatchId);
    const result2 = match?.match_results?.[1];
    const isWinner = result2?.is_winner;
    return (
      <Button
        onClick={() => handleUpdateIsWinner(result2!.id!, !result2!.is_winner)}
        color={isWinner ? "success" : "info"}
      >
        {isWinner ? "是" : "否"}
      </Button>
    );
  };

  const handleUpdateLaneNumber = () => {
    const result1 = eliminationDetail?.stages
      ?.find((stage) => stage.id === selectedStageId)
      ?.matchs?.find((match) => match.id === selectedMatchId)
      ?.match_results?.[0];
    const result2 = eliminationDetail?.stages
      ?.find((stage) => stage.id === selectedStageId)
      ?.matchs?.find((match) => match.id === selectedMatchId)
      ?.match_results?.[1];

    updateLaneNumber({
      id: result1!.id!,
      matchResult: { lane_number: laneNumber1 },
    });
    updateLaneNumber({
      id: result2!.id!,
      matchResult: { lane_number: laneNumber2 },
    });
  };

  const canCreateStage = () => {
    if (eliminationDetail?.stages?.length === 0) return true;
    const stageNum = stages.length;
    const advancingNum = eliminationDetail.stages![0].matchs!.length! * 2;
    const maxStageNum = Math.floor(Math.log2(advancingNum));
    return stageNum < maxStageNum;
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
                  <Button
                    variant="outlined"
                    disabled={!stage.id || isStageAdvancing}
                    onClick={() => advanceStage(stage.id!)}
                    sx={{ width: "100%", mb: 1 }}
                  >
                    {isFinalStage ? "依結果結算獎牌" : "依結果填入下一階段"}
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
                        onClick={
                          set1 && set2
                            ? () =>
                                handleMatchInfoDialogOpen(
                                  match.id!,
                                  stage.id!,
                                  set1,
                                  set2
                                )
                            : undefined
                        }
                        sx={{
                          cursor: set1 && set2 ? "pointer" : "default",
                          mb: 2,
                          ml: 2,
                          mr: 2,
                        }}
                      >
                        <Stack direction="row">
                          <LaneNumber
                            laneNumber={result1?.lane_number}
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
      <Dialog open={matchInfoDialogOpen}>
        <DialogContent>
          Match ID:{" "}
          <span style={{ fontWeight: "bold" }}>{selectedMatchId}</span>
          <Box sx={{ mt: 2 }}>
            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      colSpan={parseInt(params.teamSize)}
                      align="center"
                    >
                      <Autocomplete
                        options={playerSetOptions}
                        value={setOption1}
                        onChange={(_, newValue) => setSetOption1(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="選擇選手" />
                        )}
                        sx={{ width: "200px" }}
                      />
                    </TableCell>
                    <TableCell align="center">贏家</TableCell>
                    <TableCell align="center">靶道</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {set1Detail?.players?.map((player) => (
                      <TableCell colSpan={1} align="center">
                        {player.name}
                      </TableCell>
                    ))}
                    <TableCell colSpan={1} align="center">
                      {getWinnerButton1()}
                    </TableCell>
                    <TableCell align="center" colSpan={1}>
                      <TextField
                        value={laneNumber1}
                        type="number"
                        onChange={(e) =>
                          setLaneNumber1(parseInt(e.target.value))
                        }
                        sx={{ width: "60px" }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      colSpan={parseInt(params.teamSize)}
                      align="center"
                    >
                      <Autocomplete
                        options={playerSetOptions}
                        value={setOption2}
                        onChange={(_, newValue) => setSetOption2(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="選擇選手" />
                        )}
                        sx={{ width: "200px" }}
                      />
                    </TableCell>
                    <TableCell align="center">贏家</TableCell>
                    <TableCell align="center">靶道</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {set2Detail?.players?.map((player) => (
                      <TableCell colSpan={1} align="center">
                        {player.name}
                      </TableCell>
                    ))}
                    <TableCell colSpan={1} align="center">
                      {getWinnerButton2()}
                    </TableCell>
                    <TableCell align="center" colSpan={1}>
                      <TextField
                        value={laneNumber2}
                        type="number"
                        onChange={(e) =>
                          setLaneNumber2(parseInt(e.target.value))
                        }
                        sx={{ width: "60px" }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions>
          {!bracketExists && (
            <Button
              color="success"
              onClick={() =>
                updatePlayerSets({
                  matchId: selectedMatchId!,
                  playerSetIds: {
                    player_set_ids: [setOption1!.id!, setOption2!.id!],
                  },
                })
              }
            >
              更新選手
            </Button>
          )}
          <Button color="success" onClick={handleUpdateLaneNumber}>
            更新靶道
          </Button>
          <Button color="info" onClick={handleMatchInfoDialogClose}>
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Page;
