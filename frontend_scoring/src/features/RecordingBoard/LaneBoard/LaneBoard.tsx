import LaneNumber from "./LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import useGetGroupsWithPlayers from "../../../QueryHooks/useGetGroupsWithPlayers";
import useGetLaneWithPlayersScores from "../../../QueryHooks/useGetLaneWithPlayersScores";
import ScoreController from "./ScoreController/ScoreController";
import { useDispatch, useSelector } from "react-redux";
import TargetSigns from "./TargetSigns";
import { setSelectedPlayerID } from "./ScoreController/scoreControllerSlice";
import useGetCompetition from "../../../QueryHooks/useGetCompetition";
import PreQualificationNote from "./PreQualificationNote";
import { Group } from "../../../QueryHooks/types/Competition";

export default function LaneBoard() {
  const dispatch = useDispatch();
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups } = useGetGroupsWithPlayers(competitionID);
  const { data: competition } = useGetCompetition(competitionID);
  const participantID = useSelector((state: any) => state.user.userId);
  const player = findPlayer(groups, participantID);
  const { data: lane } = useGetLaneWithPlayersScores(player?.lane_id ?? 0);
  const selectedPlayerID = useSelector(
    (state: any) => state.scoreController.selectedPlayerID
  );

  if (player === undefined || lane === undefined || competition === undefined)
    return <></>;

  const handleOnChange = (_event: any, newID: number) => {
    dispatch(setSelectedPlayerID(newID));
  };

  let playerInfos = [];
  for (let i = 0; i < lane.players.length; i++) {
    const player = lane.players[i];
    if (player === undefined) continue;
    playerInfos.push(
      <ToggleButton value={player.id} key={i} className="player_button">
        <PlayerInfoBar player={player}></PlayerInfoBar>
      </ToggleButton>
    );
  }

  if (competition.qualification_current_end === 0) {
    return <PreQualificationNote></PreQualificationNote>;
  }

  return (
    <div className="lane_board">
      <LaneNumber laneNum={lane.lane_number} />
      <TargetSigns orders={lane.players.map((p: any) => p.order)} />
      <ToggleButtonGroup
        className="player_button_group"
        color="info"
        fullWidth={true}
        value={selectedPlayerID}
        onChange={handleOnChange}
        exclusive
      >
        {playerInfos}
      </ToggleButtonGroup>
      <ScoreController
        player={lane.players.find((p) => p.id === player.id)}
        selectedPlayer={lane.players.find((p) => p.id === selectedPlayerID)}
        possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} // TODO: get possible scores from "server"
      ></ScoreController>
    </div>
  );
}

const findPlayer = (groups: Group[] | undefined, participantID: number) => {
  if (groups === undefined) return;
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups[i].players.length; j++) {
      if (groups[i].players[j].participant_id === participantID) {
        return groups[i].players[j];
      }
    }
  }
};
