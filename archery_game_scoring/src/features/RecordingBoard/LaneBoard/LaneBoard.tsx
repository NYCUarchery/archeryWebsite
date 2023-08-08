import LaneNumber from "./LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useState } from "react";

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
      <ToggleButton value={props.userNames[i]} href="">
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
        color="info"
        fullWidth={true}
        value={props.stageInfo.status === "ended" ? null : selectedPlayer}
        onChange={handleSelectedPlayerChange}
        exclusive
        disabled={props.stageInfo.status === "ended" ? true : false}
      >
        {playerInfos}
      </ToggleButtonGroup>
    </div>
  );
}
