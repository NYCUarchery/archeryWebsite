import LaneNumber from "./LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import ScoreController from "./ScoreController/ScoreController";
import { useAppDispatch, useAppSelector } from "store/hooks";
import TargetSigns from "./TargetSigns";
import { setSelectedIndex } from "./qualificationScoringSlice";
import PreQualificationNote from "./PreQualificationNote";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { Player } from "@/types/oldRef/Player";
import { LaneWithEnds } from "@/utils/QueryHooks/useGetCurrentEndWithLaneByPlayer";
import { useComputed } from "@preact/signals-react";

interface Props {
  player: Player;
  lane: LaneWithEnds;
  competitionId: number;
}
export default function LaneBoard({ player, competitionId, lane }: Props) {
  const dispatch = useAppDispatch();
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const selectedOrder = useAppSelector(
    (state) => state.qualificationScoring.selectedOrder
  );
  const selectedPlayerId = useComputed(() => {
    return lane.players.find((p) => p.order === selectedOrder)?.id ?? -1;
  });
  const selectedEnd = useComputed(() => {
    const index = lane.players.findIndex((p) => p.order === selectedOrder);
    return lane.ends[index];
  });

  if (player === undefined || lane === undefined || competition === undefined)
    return <></>;

  const handleOnChange = (_event: any, newOrder: number) => {
    dispatch(setSelectedIndex(newOrder));
  };

  let playerInfos = [];
  for (let i = 0; i < lane.players.length; i++) {
    const player = lane.players[i];
    const end = lane.ends[i];
    if (player === undefined) continue;
    playerInfos.push(
      <ToggleButton value={player.order} key={i} className="player_button">
        <PlayerInfoBar player={player} end={end}></PlayerInfoBar>
      </ToggleButton>
    );
  }

  if (competition.qualification_current_end === 0) {
    return <PreQualificationNote></PreQualificationNote>;
  }

  return (
    <Box className="lane_board">
      <LaneNumber laneNum={lane.lane_number} />
      <TargetSigns orders={lane.players.map((p: any) => p.order)} />
      <ToggleButtonGroup
        className="player_button_group"
        color="info"
        fullWidth={true}
        value={selectedOrder}
        onChange={handleOnChange}
        exclusive
      >
        {playerInfos}
      </ToggleButtonGroup>
      <ScoreController
        selectedEnd={selectedEnd.value}
        possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} // TODO: get possible scores from "server"
        onScoreChange={(score: number) => {}}
      ></ScoreController>
    </Box>
  );
}
