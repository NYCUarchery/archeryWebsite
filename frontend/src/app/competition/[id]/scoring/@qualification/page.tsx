"use client";
import useGetPlayersByParticipant from "@/utils/QueryHooks/useGetPlayersByParticipant";
import useGetCurrentParticipentDetail from "@/utils/QueryHooks/useGetCurrentParticipentDetail";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { Participant } from "@/types/oldRef/Participant";
import useGetCurrentEndWithLaneByPlayer from "@/utils/QueryHooks/useGetCurrentEndWithLaneByPlayer";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import LaneBoard from "./LaneBoard/LaneBoard";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  addScore,
  confirm,
  deleteScore,
  initEnds,
  setSelectedOrder,
} from "./qualificationScoringSlice";
import { useEffect, useState } from "react";
import { useMutation } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { EndToPatch, extractEnds } from "@/utils/extractEnds";
import { Snackbar, Alert } from "@mui/material";

export default function Page({ params }: { params: { id: string } }) {
  const [successSnackbar, setSuccessSnackbar] = useState(false);
  const [errorSnackbar, setErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useAppDispatch();
  const selectedOrder = useAppSelector(
    (state) => state.qualificationScoring.selectedOrder
  );
  const ends = useAppSelector((state) => state.qualificationScoring.ends);
  const { data: user } = useGetCurrentUserDetail();
  const competitionId = parseInt(params.id);
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const { data: participant } = useGetCurrentParticipentDetail(
    competitionId,
    user?.id
  );
  const { data: players } = useGetPlayersByParticipant(
    (participant as Participant)?.id,
    competitionId
  );
  const { data: lane } = useGetCurrentEndWithLaneByPlayer(
    players?.[0],
    competition?.qualification_current_end
  );

  const { mutate: sendScore } = useMutation(
    (endsToPatch: EndToPatch[]) => {
      const response = Promise.all(
        endsToPatch.map((end) => {
          return apiClient.player.allEndscoresPartialUpdate(end.id, end.scores);
        })
      );
      return response;
    },
    {
      onSuccess: () => {
        setSuccessSnackbar(true);
      },
      onError: (error: any) => {
        setErrorMessage(error.message);
        setErrorSnackbar(true);
      },
    }
  );
  const { mutate: confirmEnd } = useMutation(
    (endId: number) => {
      return apiClient.player.isconfirmedPartialUpdate(endId, {
        is_confirmed: true,
      });
    },
    {
      onSuccess: (_, endId) => {
        const index = lane?.ends.findIndex((e) => e.id === endId);
        dispatch(confirm(index!));
      },
    }
  );

  const onSelectedOrderChange = (index: number) => {
    dispatch(setSelectedOrder(index));
  };

  const onAddScore = (score: number) => {
    dispatch(addScore(score));
  };
  const onDeleteScore = () => {
    dispatch(deleteScore());
  };
  const onSendScore = () => {
    const endsToPatch = extractEnds(ends);
    sendScore(endsToPatch);
  };
  const onConfirm = () => {
    const endId = lane?.ends[selectedOrder - 1].id;
    confirmEnd(endId!);
  };
  useEffect(() => {
    if (lane) dispatch(initEnds(lane.ends));
  }, [lane]);
  const handleClose = () => {
    setSuccessSnackbar(false);
    setErrorSnackbar(false);
  };

  if (!players || !lane) return <></>;

  return (
    <>
      <LaneBoard
        player={players[0]}
        lane={lane}
        ends={ends}
        competitionId={competitionId}
        selectedOrder={selectedOrder}
        onSelectedOrderChange={onSelectedOrderChange}
        onAddScore={onAddScore}
        onDeleteScore={onDeleteScore}
        onSendScore={onSendScore}
        onConfirm={onConfirm}
      />
      <Snackbar
        open={successSnackbar}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          送出成功d(`･∀･)b
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorSnackbar}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          送出部分失敗或完全失敗(´;ω;`)
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
