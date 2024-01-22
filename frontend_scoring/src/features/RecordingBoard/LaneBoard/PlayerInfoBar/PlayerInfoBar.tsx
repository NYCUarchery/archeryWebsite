import ConfirmationSignal from "./ConfirmationSignal";
import NameBar from "./NameBar";
import ScoreBar from "./ScoreBar";
import { useSelector } from "react-redux";
import useGetCompetition from "../../../../QueryHooks/useGetCompetition";
import { extractEnd, extractScores } from "../util";

interface Props {
  player: any;
}

export default function PlayerInfo({ player }: Props) {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition } = useGetCompetition(competitionID);
  const currentEnd = competition?.qualification_current_end;

  if (!player || !competition || !currentEnd) return <></>;
  const end = extractEnd(player, currentEnd);
  const scores = extractScores(end);
  const isConfirmed = end.is_confirmed;

  return (
    <div className="player_info_bar">
      <ConfirmationSignal confirmed={isConfirmed}></ConfirmationSignal>
      <NameBar name={player.name}></NameBar>
      <ScoreBar scores={scores}></ScoreBar>
    </div>
  );
}
