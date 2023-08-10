import LaneNumber from "./LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useState } from "react";
import ScoreController from "./ScoreController/ScoreController";

interface Props {
  laneNum: number;
  userNames: string[];
  stageInfo: any;
}

export default function LaneBoard(props: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const handleSelectedPlayerChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPlayer: string
  ) => {
    setSelectedPlayer((_currentPlayer) => {
      console.log(newPlayer);
      return newPlayer;
    });
  };

  let playerInfos = [];
  for (let i = 0; i < props.userNames.length; i++) {
    console.log(props.stageInfo.confirmations[i]);
    playerInfos.push(
      <ToggleButton value={props.userNames[i]} className="player_button">
        <PlayerInfoBar
          name={props.userNames[i]}
          comfirmed={props.stageInfo.confirmations[i]}
          scores={props.stageInfo.all_scores[i]}
        ></PlayerInfoBar>
      </ToggleButton>
    );
  }

  return (
    <div className="lane_board">
      <LaneNumber laneNum={props.laneNum} />
      <ToggleButtonGroup
        className="player_button_group"
        color="info"
        fullWidth={true}
        value={props.stageInfo.status === "ended" ? null : selectedPlayer}
        onChange={handleSelectedPlayerChange}
        exclusive
        disabled={props.stageInfo.status === "ended" ? true : false}
      >
        {playerInfos}
      </ToggleButtonGroup>
      {props.stageInfo.status === "ended" ? null : (
        <ScoreController
          possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} // TODO: get possible scores from "server"
        ></ScoreController>
      )}
    </div>
  );
}
