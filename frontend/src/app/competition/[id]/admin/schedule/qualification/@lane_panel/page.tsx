"use client";
import { useState } from "react";
import { apiClient } from "@/utils/ApiClient";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { useAppSelector } from "store/hooks";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { Competition } from "@/types/oldRef/Competition";
import { Qualification } from "@/types/oldRef/Qualification";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function Page({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const competitionId = parseInt(params.id);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [playerToUnassign, setPlayerToUnassign] = useState<number | null>(null);
  const competition = (
    queryClient.getQueryData(["competitionWithGroups", competitionId]) as any
  ).data as Competition;
  const groupIndex = useAppSelector((state) => state.schedule.groupIndex);
  const { data: qualifications } = useQuery(
    ["qualificationLanesUnassignedDetail", groupIndex],
    () =>
      apiClient.qualification.qualificationLanesUnassignedDetail(
        competition?.groups![groupIndex].id
      ),
    { select: (data) => data.data as Qualification[] }
  );

  const handleSuccess = () => {
    queryClient.invalidateQueries([
      "qualificationLanesUnassignedDetail",
      groupIndex,
    ]);
    setSelectedPlayer(null);
  };
  const { mutate: assignPlayerLane } = useMutation(
    ({ playerId, laneId }: { playerId: number; laneId: number }) =>
      apiClient.player.laneidUpdate(playerId, { lane_id: laneId }),
    {
      onSuccess: handleSuccess,
    }
  );
  const { mutate: assignPlayerOrder } = useMutation(
    ({ playerId, order }: { playerId: number; order: number }) =>
      apiClient.player.orderUpdate(playerId, { order: order }),
    {
      onSuccess: handleSuccess,
    }
  );
  const qualification = qualifications ? qualifications[0] : null;
  const unassignedplayers = qualifications
    ? qualifications[1].lanes[0].players
    : [];

  const handleAssign = (laneId: number, order: number) => {
    assignPlayerLane({
      playerId: selectedPlayer!,
      laneId: laneId,
    });
    assignPlayerOrder({
      playerId: selectedPlayer!,
      order: order,
    });
  };
  const hanedleUnassign = () => {
    assignPlayerLane({
      playerId: playerToUnassign as number,
      laneId: qualifications![1].lanes[0].id,
    });
    assignPlayerOrder({
      playerId: playerToUnassign as number,
      order: 0,
    });
    setSelectedPlayer(null);
  };

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <TableContainer component={Paper} sx={{ width: "250px", mr: "20px" }}>
          <Table aria-label="unassigned players table">
            <TableHead>
              <TableRow>
                <TableCell>Pl ID</TableCell>
                <TableCell>姓名</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unassignedplayers.map((player) => (
                <TableRow
                  key={player.name}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    cursor: "pointer",
                  }}
                  selected={selectedPlayer === player.id}
                  onClick={() => {
                    if (selectedPlayer === player.id) {
                      setSelectedPlayer(null);
                    } else {
                      setSelectedPlayer(player.id);
                    }
                  }}
                >
                  <TableCell component="th" scope="row">
                    {player.id}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {player.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TableContainer component={Paper}>
          <Table aria-label="unassigned players table">
            <TableHead>
              <TableRow>
                <TableCell align="center">靶道</TableCell>
                <TableCell align="center">A</TableCell>
                <TableCell align="center">B</TableCell>
                <TableCell align="center">C</TableCell>
                <TableCell align="center">D</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualification?.lanes.map((lane) => (
                <TableRow
                  key={lane.lane_number}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    cursor: "pointer",
                  }}
                >
                  <TableCell component="th" scope="row" align="center">
                    {lane.lane_number}
                  </TableCell>
                  {Array(4)
                    .fill(null)
                    .map((_, index) => (
                      <TableCell component="th" scope="row" align="center">
                        {lane.players.find((p) => p.order === index + 1) ? (
                          <Button
                            variant="contained"
                            onClick={() => {
                              setPlayerToUnassign(
                                lane.players.find((p) => p.order === index + 1)!
                                  .id
                              );
                              setOpen(true);
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            {
                              lane.players.find((p) => p.order === index + 1)!
                                .name
                            }
                            <br />
                            Pl. ID:
                            {
                              lane.players.find((p) => p.order === index + 1)!
                                .id
                            }
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            disabled={selectedPlayer === null}
                            onClick={() => handleAssign(lane.id, index + 1)}
                            sx={{ textTransform: "none" }}
                          >
                            空
                          </Button>
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent>確定要把選手從這個靶位移除嗎？</DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              hanedleUnassign();
              setOpen(false);
            }}
          >
            確定
          </Button>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
