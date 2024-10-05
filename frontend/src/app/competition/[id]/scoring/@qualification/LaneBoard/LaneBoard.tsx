import LaneNumber from "./LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import ScoreController from "./ScoreController/ScoreController";
import TargetSigns from "./TargetSigns";
import PreQualificationNote from "./PreQualificationNote";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { Player } from "@/types/oldRef/Player";
import { LaneWithEnds } from "@/utils/QueryHooks/useGetCurrentEndWithLaneByPlayer";
import { DatabaseRoundEnd } from "@/types/Api";

interface Props {
  player: Player;
  lane: LaneWithEnds;
  ends: DatabaseRoundEnd[];
  competitionId: number;
  selectedOrder: number;
  onSelectedOrderChange: (index: number) => void;
  onAddScore: (score: number) => void;
  onDeleteScore: () => void;
  onSendScore: () => void;
  onConfirm: () => void;
}
export default function LaneBoard({
  player,
  lane,
  ends,
  competitionId,
  selectedOrder,
  onSelectedOrderChange,
  onAddScore,
  onDeleteScore,
  onSendScore,
  onConfirm,
}: Props) {
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const selectedEnd =
    ends[lane.players.findIndex((p) => p.order === selectedOrder)];

  if (player === undefined || lane === undefined || competition === undefined)
    return <></>;

  const handleOnChange = (_event: any, newOrder: number) => {
    onSelectedOrderChange(newOrder);
  };

  const playerInfos = [];
  for (let i = 0; i < lane.players.length; i++) {
    const player = lane.players[i];
    const end = ends[i];
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
        selectedEnd={selectedEnd}
        possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} // TODO: get possible scores from "server"
        onAddScore={onAddScore}
        onDeleteScore={onDeleteScore}
        onSendScore={onSendScore}
        onConfirm={onConfirm}
      ></ScoreController>
    </Box>
  );
}
