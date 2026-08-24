"use client";
import {
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
} from "@mui/material";
import { useAppSelector } from "store/hooks";
import useGetPlayerSets from "@/utils/QueryHooks/useGetPlayerSets";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import useGetPlayerSetDetail from "@/utils/QueryHooks/useGetPlayerSetDetail";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import { isCompleteEliminationBracket } from "@/utils/eliminationBracket";

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
  const { data: elimination } = useGetElimination(
    parseInt(params.id),
    groupIndex - 1, // 0 is unassigned group in the for the group menu.
    parseInt(params.teamSize)
  );
  const { mutate: deletePlayerSet } = useMutation(
    (id: number) => apiClient.playerSet.playersetDelete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "playerSets",
          elimination!.elimination_id,
        ]);
      },
    }
  );
  const { data: playerSets, isFetching: isPlayerSetFetching } =
    useGetPlayerSets(elimination?.elimination_id);
  const { data: eliminationDetail } = useGetEliminationDetail(
    elimination?.elimination_id
  );
  const bracketExists = isCompleteEliminationBracket(eliminationDetail?.stages);
  const { data: playerSet } = useGetPlayerSetDetail(playerSetId);
  const handleDelete = () => {
    deletePlayerSet(setIdToDelete!);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>排名</TableCell>
              <TableCell>總分</TableCell>
              <TableCell>隊名</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerSets?.map((set) => {
              return (
                <TableRow key={set.id}>
                  <TableCell>{set.rank}</TableCell>
                  <TableCell>{set.total_score}</TableCell>
                  <TableCell
                    onClick={() => {
                      setPlayerSetId(set.id!);
                      setPlayerSetDialogOpen(true);
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    {set.set_name}
                  </TableCell>
                  <TableCell>
                    {!bracketExists && (
                      <IconButton
                        onClick={() => {
                          setDeleteDialogOpen(true);
                          setSetIdToDelete(set.id!);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
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
