import LaneNumber from "./LaneNumber";
import PlayerInfoBar from "./PlayerInfoBar/PlayerInfoBar";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useState, useEffect } from "react";
import ScoreController from "./ScoreController/ScoreController";
import { useDispatch, useSelector } from "react-redux";
import {
  initScoreController,
  selectPlayer,
} from "./ScoreController/scoreControllerSlice";

interface Props {
  scoreNum: number;
  laneNum: number;
  userNames: string[];
  stageInfo: any;
}

export default function LaneBoard(props: Props) {
  const dispatch = useDispatch();
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  const [selectedPlayer, setSelectedPlayer] = useState(-1);
  const handleSelectedPlayerChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPlayer: number
  ) => {
    setSelectedPlayer((_currentPlayer) => {
      return newPlayer;
    });
  };

  useEffect(() => {
    dispatch(
      initScoreController({
        scoreNum: props.scoreNum,
        allScores: props.stageInfo.all_scores,
        totals: props.stageInfo.totals,
        confirmations: props.stageInfo.confirmations,
      })
    );
  }, [stageShown, boardShown]);
  useEffect(() => {
    dispatch(selectPlayer(selectedPlayer));
  }, [selectedPlayer]);

  let playerInfos = [];
  for (let i = 0; i < props.userNames.length; i++) {
    playerInfos.push(
      <ToggleButton value={i} className="player_button">
        <PlayerInfoBar name={props.userNames[i]} player={i}></PlayerInfoBar>
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
          selectedPlayer={selectedPlayer}
          possibleScores={[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]} // TODO: get possible scores from "server"
        ></ScoreController>
      )}
    </div>
  );
}
