"use client";
import {
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

interface PlayerSetOption {
  id: number;
  label: string;
}

function Page({ params }: { params: { id: string; teamSize: string } }) {
  const queryClient = useQueryClient();
  const [setOption1, setSetOption1] = useState<PlayerSetOption | null>(null);
  const [setOption2, setSetOption2] = useState<PlayerSetOption | null>(null);
  const [set1Detail, setSet1Detail] = useState<DatabasePlayerSet | null>(null);
  const [set2Detail, setSet2Detail] = useState<DatabasePlayerSet | null>(null);
  const [laneNumber1, setLaneNumber1] = useState<number>(0);
  const [laneNumber2, setLaneNumber2] = useState<number>(0);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);
  const [matchInfoDialogOpen, setMatchInfoDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number>();
  const [selectedStageId, setSelectedStageId] = useState<number>();

  const { data: groups } = useGetCompetitionGroupsWithPlayers(
    parseInt(params.id)
  );

  const groupIndex = useAppSelector((state) => state.schedule.groupIndex);
  const { data: elimination } = useGetElimination(
    parseInt(params.id),
    groupIndex - 1, // 0 is unassigned group in the for the group menu.
    parseInt(params.teamSize)
  );
  const { data: eliminationDetail } = useGetEliminationDetail(
    elimination?.elimination_id
  );
  const playerSets = eliminationDetail?.player_sets;

  const playerSetOptions: PlayerSetOption[] =
    playerSets?.map((set) => ({
      id: set.id!,
      label: set.set_name! + ` No.${set.rank}`,
    })) ?? [];

  const stages = eliminationDetail?.stages ?? [];

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

  if (!eliminationDetail) return <Typography>Loading...</Typography>;

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

  const handleMatchInfoDialogOpen = (matchId: number, stageId: number) => {
    const match = eliminationDetail?.stages
      ?.find((stage) => stage.id === stageId)
      ?.matchs?.find((match) => match.id === matchId);

    const result1 = match?.match_results?.[0];
    const result2 = match?.match_results?.[1];

    const set1 = playerSets?.find((set) => set.id === result1?.player_set_id);
    const set2 = playerSets?.find((set) => set.id === result2?.player_set_id);
    setSet1Detail(set1!);
    setSet2Detail(set2!);

    setLaneNumber1(result1!.lane_number!);
    setLaneNumber2(result2!.lane_number!);

    setSelectedMatchId(matchId);
    setSelectedStageId(stageId);
    setMatchInfoDialogOpen(true);
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
          <Button onClick={handleCreateStage} disabled={!canCreateStage()}>
            創建階段
          </Button>
        </Stack>
      </Card>
      <Card sx={{ p: 2, display: "flex" }}>
        {stages.map((stage) => {
          return (
            <Paper sx={{ width: "300px" }}>
              <Button
                onClick={() => {
                  setSelectedStageId(stage.id!);
                  setCreateMatchDialogOpen(true);
                }}
                sx={{ width: "100%" }}
              >
                創建對抗組
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
                    onClick={() =>
                      handleMatchInfoDialogOpen(match.id!, stage.id!)
                    }
                    sx={{ cursor: "pointer", mb: 2, ml: 2, mr: 2 }}
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
      </Card>
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
                      {set1Detail?.set_name}
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
                      {set2Detail?.set_name}
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
          <Button color="success" onClick={handleUpdateLaneNumber}>
            更新靶道
          </Button>
          <Button color="info" onClick={() => setMatchInfoDialogOpen(false)}>
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Page;
