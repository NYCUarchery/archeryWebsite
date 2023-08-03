import MatchBlock from "./MatchBlock";

interface Props {
  stageId: number;
  stage: any;
}

export default function StageBoard(props: Props) {
  let matches = [];

  for (let i = 0; i < props.stage.matches.length; i++) {
    matches.push(<MatchBlock match={props.stage.matches[i]}></MatchBlock>);
  }

  return <div className="stage_board">{matches}</div>;
}
