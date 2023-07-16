import RankColumnElement from "./RankColumnElement";
import TargetColumnElement from "./TargetColumnElement";
import NameColumnElement from "./NameColumnElement";
import InstitutionsColumnElement from "./InstitutionColumnElement";
import ScoreColumnElement from "./ScoreColumnElement";
import PlayerInfos from "./QualifyingPhaseInfo.json";
import { useSelector} from "react-redux";


function QualifyingPhaseBoard(){
    const phaseShown = useSelector((state:any) => state.phaseListButton.phaseShown)
    if(phaseShown !== "資格賽"){
        return <></>
    }
    return <div className="qualifying_phase_board"><Scoreboard></Scoreboard></div>;
}

function Scoreboard(){
    const groupShown: keyof typeof PlayerInfos= useSelector((state:any) => state.groupListButton.groupShown)
    let players = PlayerInfos[groupShown];

    return <div className="scoreboard">
        <ColumnTitle></ColumnTitle>
        {players.map((player) => <RankingInfoBar player = {player}></RankingInfoBar>)}
    </div>;
}

function ColumnTitle(){
    return <div className="scoreboard_row column_title">
        <RankColumnElement content="排名"></RankColumnElement>
        <TargetColumnElement content="靶號"></TargetColumnElement>
        <NameColumnElement content="姓名"></NameColumnElement>
        <InstitutionsColumnElement content="組織"></InstitutionsColumnElement>
        <ScoreColumnElement content="分數"></ScoreColumnElement>
        
    </div>
}

interface RankingProps{
    player: any;
}

function RankingInfoBar(rankingProps: RankingProps){



    return <div className="scoreboard_row ranking_info_bar">
        {
            <>
            <RankColumnElement content= {rankingProps.player.rank}></RankColumnElement>
            <TargetColumnElement content= {rankingProps.player.target}></TargetColumnElement>
            <NameColumnElement content = {rankingProps.player.name}></NameColumnElement>
            <InstitutionsColumnElement content = {rankingProps.player.institution}></InstitutionsColumnElement>
            <ScoreColumnElement content = {rankingProps.player.score}></ScoreColumnElement>
            </>
        }

    </div>;
}

export default QualifyingPhaseBoard;