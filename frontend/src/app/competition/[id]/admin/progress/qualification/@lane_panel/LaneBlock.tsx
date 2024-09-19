"use client";
import CircleSign from "@/components/CircleSign";
import useGetLaneConfirmations, {
  Confirmation,
} from "@/utils/QueryHooks/useGetLaneConfirmations";
import getTarget from "@/utils/getTarget";
import { useQueryClient } from "react-query";
import { useMutation } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { useEffect } from "react";
import { useState } from "react";

interface Props {
  laneId: number;
  laneNumber: number;
  currentEndIndex: number;
}
export default function LaneBlock({
  laneId,
  laneNumber,
  currentEndIndex,
}: Props) {
  const [signals, setSignals] = useState<JSX.Element[]>([]);
  const { data: confirmations } = useGetLaneConfirmations(
    laneId,
    currentEndIndex
  );
  const queryClient = useQueryClient();

  const { mutate: toggleConfirmation } = useMutation(
    (confirmation: Confirmation) =>
      apiClient.player.playerIsconfirmedUpdate(confirmation.endId, {
        is_confirmed: !confirmation.isConfirmed,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "laneConfirmations",
          laneId,
          currentEndIndex,
        ]);
      },
    }
  );

  useEffect(() => {
    const tempSignals: JSX.Element[] = [];
    for (let i = 0; i < 4; i++) {
      const confirmation =
        confirmations?.find((confirmation) => confirmation.order === i + 1) ??
        null;
      let signal = null;
      if (confirmation) {
        const target = getTarget(laneNumber, confirmation.order);
        const isConfirmed = confirmation.isConfirmed;
        signal = (
          <CircleSign
            text={target}
            diameter={30}
            backgroundColor={isConfirmed ? "green" : "red"}
            sx={{ cursor: "pointer" }}
            onClick={() => toggleConfirmation(confirmation)}
          />
        );
      }
      tempSignals.push(
        <TableCell align="center" width={"25%"} height={30} key={i}>
          {signal}
        </TableCell>
      );
    }
    setSignals(tempSignals);
  }, [confirmations]);

  return (
    <TableContainer component={Paper} sx={{ overflow: "clip" }}>
      <Table aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell colSpan={4} align="center">
              第{laneNumber}道
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>{signals}</TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
