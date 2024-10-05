import ConfirmationSignal from "./ConfirmationSignal";
import NameBar from "./NameBar";
import ScoreBar from "./ScoreBar";
import { extractScores } from "../util";
import { Player } from "@/types/oldRef/Player";
import { DatabaseRoundEnd } from "@/types/Api";

interface Props {
  player: Player;
  end: DatabaseRoundEnd;
}

export default function PlayerInfo({ player, end }: Props) {
  if (!player) return <></>;
  const scores = extractScores(end);
  const isConfirmed = end?.is_confirmed ?? false;

  return (
    <div className="player_info_bar">
      <ConfirmationSignal confirmed={isConfirmed}></ConfirmationSignal>
      <NameBar name={player.name}></NameBar>
      <ScoreBar scores={scores}></ScoreBar>
    </div>
  );
}
