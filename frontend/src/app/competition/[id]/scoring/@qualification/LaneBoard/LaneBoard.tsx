import LaneNumber from "@/components/LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import ScoreController from "@/components/ScoreController/ScoreController";
import { extractScores } from "@/components/ScoreController/util";
import TargetSigns from "./TargetSigns";
import { Player } from "@/types/oldRef/Player";
import { LaneWithEnds } from "@/utils/QueryHooks/useGetCurrentEndWithLaneByPlayer";
import { DatabaseCompetition, DatabaseRoundEnd } from "@/types/Api";

interface Props {
  player: Player;
  lane: LaneWithEnds;
  ends: DatabaseRoundEnd[];
  competition: DatabaseCompetition;
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
  competition,
  selectedOrder,
  onSelectedOrderChange,
  onAddScore,
  onDeleteScore,
  onSendScore,
  onConfirm,
}: Props) {
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
      <ToggleButton value={player.order} key={i} sx={{ height: "350px" }}>
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
        sx={{ marginButtom: "1rem" }}
      >
        {playerInfos}
      </ToggleButtonGroup>
      <ScoreController
        scores={extractScores(selectedEnd)}
        isConfirmed={selectedEnd?.is_confirmed ?? false}
        // 尚未選中任何選手（selectedEnd 為 undefined）時，容量設為 0 使 isFull 恆真，
        // 讓分數鈕維持停用，還原「未選選手不可記分」的舊行為（避免 dispatch 到不存在的 end 而 crash）。
        maximumArrowCount={selectedEnd ? 6 : 0}
        possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} // TODO: get possible scores from "server"
        onAddScore={onAddScore}
        onDeleteScore={onDeleteScore}
        onSave={onSendScore}
        onConfirm={onConfirm}
        isSaving={false}
      ></ScoreController>
    </Box>
  );
}
