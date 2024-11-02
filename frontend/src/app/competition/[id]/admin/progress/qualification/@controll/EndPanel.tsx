"use client";

import CircleSign from "@/components/CircleSign";
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ButtonGroup,
  Button,
  Snackbar,
} from "@mui/material";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { useState } from "react";

interface Props {
  competitionId: number;
  currentEndIndex: number;
  roundNum: number;
}
export default function EndPanel({
  currentEndIndex,
  roundNum,
  competitionId,
}: Props) {
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarColor, setSnackbarColor] = useState<"success" | "error">(
    "success"
  );
  const queryClient = useQueryClient();

  const { mutate: updataRank } = useMutation(
    () =>
      apiClient.competition.refreshGroupsPlayersRankPartialUpdate(
        competitionId
      ),
    {
      onSuccess: () => {
        setSnackbarOpen(true);
        setSnackbarMessage("更新排名成功");
        setSnackbarColor("success");
      },
      onError: () => {
        setSnackbarOpen(true);
        setSnackbarMessage("更新排名失敗");
        setSnackbarColor("error");
      },
    }
  );
  const { mutate: currentEndPlus } = useMutation(
    () =>
      apiClient.competition.qualificationCurrentEndPlusPartialUpdate(
        competitionId
      ),
    {
      onSuccess: () => {
        setSnackbarOpen(true);
        setSnackbarMessage("成功進到下一波");
        setSnackbarColor("success");
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
      onError: () => {
        setSnackbarOpen(true);
        setSnackbarMessage("進到下一波失敗");
        setSnackbarColor("error");
      },
    }
  );

  const { mutate: currentEndMinus } = useMutation(
    () =>
      apiClient.competition.qualificationCurrentEndMinusPartialUpdate(
        competitionId
      ),
    {
      onSuccess: () => {
        setSnackbarOpen(true);
        setSnackbarMessage("成功回到上一波");
        setSnackbarColor("success");
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
      onError: () => {
        setSnackbarOpen(true);
        setSnackbarMessage("回到上一波失敗");
        setSnackbarColor("error");
      },
    }
  );

  return (
    <>
      <Button variant="contained" onClick={() => updataRank()}>
        更新排名
      </Button>
      <ButtonGroup>
        <Button
          disabled={currentEndIndex < 0}
          onClick={() => {
            currentEndMinus();
          }}
        >
          上一波
        </Button>
        <Button
          onClick={() => currentEndPlus()}
          disabled={currentEndIndex >= roundNum * 6}
        >
          下一波
        </Button>
      </ButtonGroup>
      <TableContainer component={Paper} sx={{ overflow: "clip" }}>
        <Table aria-label="simple table" size="small">
          <TableHead>
            <TableRow>
              <TableCell colSpan={7} align="center">
                資格賽進度
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={1} align="center">
                局
              </TableCell>
              <TableCell colSpan={6} align="center">
                波
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array(roundNum)
              .fill(null)
              .map((_, roundIndex) => {
                return (
                  <TableRow key={roundIndex}>
                    <TableCell align="center">{roundIndex + 1}</TableCell>
                    {Array(6)
                      .fill(null)
                      .map((_, endIndex) => {
                        const selfEndIndex = roundIndex * 6 + endIndex;
                        let color = "red";
                        if (selfEndIndex < currentEndIndex) {
                          color = "green";
                        } else if (selfEndIndex === currentEndIndex) {
                          color = "orange";
                        }

                        return (
                          <TableCell
                            key={endIndex + roundIndex * 6}
                            sx={{ paddingLeft: 0, paddingRight: 0 }}
                          >
                            <CircleSign
                              diameter={20}
                              backgroundColor={color}
                              text={(endIndex + 1).toString()}
                            />
                          </TableCell>
                        );
                      })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarColor}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
