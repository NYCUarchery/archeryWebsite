"use client";
import useGetPlayersByParticipant from "@/utils/QueryHooks/useGetPlayersByParticipant";
import useGetCurrentParticipentDetail from "@/utils/QueryHooks/useGetCurrentParticipentDetail";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { Participant } from "@/types/oldRef/Participant";
import useGetCurrentEndWithLaneByPlayer from "@/utils/QueryHooks/useGetCurrentEndWithLaneByPlayer";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import LaneBoard from "./LaneBoard/LaneBoard";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { setSelectedOrder } from "./qualificationScoringSlice";

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const selectedOrder = useAppSelector(
    (state) => state.qualificationScoring.selectedOrder
  );
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

  const onSelectedOrderChange = (index: number) => {
    dispatch(setSelectedOrder(index));
  };

  if (!players || !lane) return <></>;

  return (
    <LaneBoard
      player={players[0]}
      lane={lane}
      competitionId={competitionId}
      selectedOrder={selectedOrder}
      onSelectedOrderChange={onSelectedOrderChange}
    />
  );
}
