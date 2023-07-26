import RankColumnElement from "./ColumnElements/RankColumnElement";
import TargetColumnElement from "./ColumnElements/TargetColumnElement";
import NameColumnElement from "./ColumnElements/NameColumnElement";
import InstitutionsColumnElement from "./ColumnElements/InstitutionColumnElement";
import ScoreColumnElement from "./ColumnElements/ScoreColumnElement";
import QualifyingPhaseInfo from "../../jsons/QualifyingPhaseInfo.json";
import { useSelector } from "react-redux";

function QualifyingPhaseBoard() {
  const phaseShown = useSelector(
    (state: any) => state.phaseListButton.phaseShown
  );
  if (phaseShown !== 0 || QualifyingPhaseInfo.game_phase !== "qualification") {
    return <></>;
  }
  return (
    <div className="qualifying_phase_board">
      <Scoreboard></Scoreboard>
    </div>
  );
}

function Scoreboard() {
  const groupShown: number = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  let gameInfo = QualifyingPhaseInfo.groups[groupShown];
  let RankingInfoBars = [];
  for (let i = 0; i < gameInfo.players.length; i++) {
    let isQudalified: boolean;
    i < gameInfo.qualification_num
      ? (isQudalified = true)
      : (isQudalified = false);

    RankingInfoBars.push(
      <RankingInfoBar
        player={gameInfo.players[i]}
        isQudalified={isQudalified}
        id={i}
      ></RankingInfoBar>
    );
  }

  return (
    <div className="scoreboard">
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
      <InstitutionsColumnElement content="組織"></InstitutionsColumnElement>
      <ScoreColumnElement content="分數"></ScoreColumnElement>
    </div>
  );
}

interface RankingProps {
  player: any;
  isQudalified: boolean;
  id: any;
}

function RankingInfoBar(rankingProps: RankingProps) {
  let className: string = "scoreboard_row ranking_info_bar";
  rankingProps.isQudalified
    ? (className += " qualified")
    : (className += " unqualified");
  return (
    <div className={className}>
      {
        <>
          <RankColumnElement
            content={rankingProps.player.rank}
          ></RankColumnElement>
          <TargetColumnElement
            content={rankingProps.player.target}
          ></TargetColumnElement>
          <NameColumnElement
            content={rankingProps.player.name}
          ></NameColumnElement>
          <InstitutionsColumnElement
            content={rankingProps.player.institution}
          ></InstitutionsColumnElement>
          <ScoreColumnElement
            content={rankingProps.player.score}
          ></ScoreColumnElement>
        </>
      }
    </div>
  );
}

export default QualifyingPhaseBoard;
