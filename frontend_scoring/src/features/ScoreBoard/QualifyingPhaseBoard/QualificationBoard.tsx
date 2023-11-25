import RankColumnElement from "./ColumnElements/RankColumnElement";
import TargetColumnElement from "./ColumnElements/TargetColumnElement";
import NameColumnElement from "./ColumnElements/NameColumnElement";
import ScoreColumnElement from "./ColumnElements/ScoreColumnElement";
import { useSelector } from "react-redux";
import useGetQualificationWithLanesPlayers from "../../../QueryHooks/useGetQualificationWithLanesPlayers";
import useGetLanes from "../../../QueryHooks/useGetLanes";

interface Props {
  groups: any;
}

export default function QualificationBoard({ groups }: Props) {
  const groupShown: number = useSelector(
    (state: any) => state.groupListButton.groupShown
  );

  const group = groups.find((g: any) => g.group_id === groupShown);
  const { data: qualification, isLoading } =
    useGetQualificationWithLanesPlayers(group?.id);
  if (!group || isLoading) return <></>;

  let RankingInfoBars = [];

  const advancingNum = qualification.advancing_num;
  for (let i = 0; i < group.players.length; i++) {
    let isQudalified: boolean;
    i < advancingNum ? (isQudalified = true) : (isQudalified = false);

    RankingInfoBars.push(
      <RankingInfoBar
        key={i}
        player={group.players[i]}
        isQudalified={isQudalified}
      ></RankingInfoBar>
    );
  }

  return (
    <div className="qualification_board">
      <ColumnTitle></ColumnTitle>
      {RankingInfoBars}
    </div>
  );
}

function ColumnTitle() {
  return (
    <div className="scoreboard_row column_title">
      <RankColumnElement content="排名"></RankColumnElement>
      <TargetColumnElement content="靶號"></TargetColumnElement>
      <NameColumnElement content="姓名"></NameColumnElement>
      <ScoreColumnElement content="分數"></ScoreColumnElement>
    </div>
  );
}

interface RankingProps {
  player: any;
  isQudalified: boolean;
}

function RankingInfoBar(rankingProps: RankingProps) {
  let className: string = "scoreboard_row ranking_info_bar";
  const player = rankingProps.player;
  const { data: lane, isLoading } = useGetLanes(player.land_id);
  if (!lane || isLoading) return <></>;
  rankingProps.isQudalified
    ? (className += " qualified")
    : (className += " unqualified");
  const target = lane.lane_number + numberToAlphabet(player.order);
  return (
    <div className={className}>
      {
        <>
          <RankColumnElement
            content={rankingProps.player.rank}
          ></RankColumnElement>
          <TargetColumnElement content={target}></TargetColumnElement>
          <NameColumnElement
            content={rankingProps.player.name}
          ></NameColumnElement>
          <ScoreColumnElement
            content={rankingProps.player.total_score}
          ></ScoreColumnElement>
        </>
      }
    </div>
  );
}

const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};
