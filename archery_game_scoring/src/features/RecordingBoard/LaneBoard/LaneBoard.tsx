import LaneNumber from "./LaneNumber";
import PlayerInfo from "./PlayerInfo/PlayerInfo";

interface Props {
  laneNum: number;
  userNames: string[];
  stageInfo: any;
}

export default function LaneBoard(props: Props) {
  let playerInfos = [];
  for (let i = 0; i < props.userNames.length; i++) {
    playerInfos.push(
      <PlayerInfo
        name={props.userNames[i]}
        scores={props.stageInfo.all_scores[i]}
      ></PlayerInfo>
    );
  }

  return (
    <div className="lane_board">
      <LaneNumber laneNum={props.laneNum} />
      {playerInfos}
    </div>
  );
}
