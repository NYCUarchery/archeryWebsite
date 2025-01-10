import LaneNumber from "@/components/LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import ScoreController from "@/components/ScoreController/ScoreController";
import TargetSigns from "./TargetSigns";
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

  if (competition.qualification_current_end === -1) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <h1>還沒開始，我知道你很急但你先別急。</h1>
      </div>
    );
  }

  if (competition.qualification_current_end! >= competition.rounds_num! * 6) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <h1>比賽結束</h1>
      </div>
    );
  }

  return (
    <Box className="lane_board">
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          color: "primary.main",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span>
            Round {Math.floor(competition.qualification_current_end! / 6) + 1}
          </span>
        </Box>
        <LaneNumber laneNumber={lane.lane_number} width="30px" height="30px" />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          End {(competition.qualification_current_end! % 6) + 1}
        </Box>
      </Box>
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
