import { useSelector } from "react-redux";
import MatchBlock from "./MatchBlock";

interface Props {
  stageId: number;
  stage: any;
}

export default function StageBoard(props: Props) {
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  if (stageShown !== props.stageId) {
    return null;
  }

  let matches = [];

  for (let i = 0; i < props.stage.matches.length; i++) {
    matches.push(<MatchBlock match={props.stage.matches[i]}></MatchBlock>);
  }

  return <div className="stage_board">{matches}</div>;
}
