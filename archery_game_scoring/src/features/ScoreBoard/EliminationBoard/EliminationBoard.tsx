import PlayersBoard from "./SubBoards/PlayersBoard/PlayersBoard";
import StageBoard from "./SubBoards/StageBoard/StageBoard";
import ResultBoard from "./SubBoards/ResultBoard/ResultBoard";
import { useSelector } from "react-redux";

interface Props {
  gameInfo: any;
}

export default function EliminationBoard(props: Props) {
  const groupShown = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  const group = props.gameInfo.groups[groupShown];
  const stageNum = useSelector((state: any) => state.stageController.stageNum);

  let stageBoards = [];

  for (let i = 1; i < stageNum - 1; i++) {
    console.log(group.stages[i - 1]);
    stageBoards.push(
      <StageBoard stageId={i} stage={group.stages[i - 1]}></StageBoard>
    );
  }

  let board: any;

  switch (stageShown) {
    case 0:
      board = <PlayersBoard players={group.players}></PlayersBoard>;
      break;
    case stageNum - 1:
      board = <ResultBoard players={group.result.players}></ResultBoard>;
      break;
    default:
      board = (
        <StageBoard
          stageId={stageShown}
          stage={group.stages[stageShown - 1]}
        ></StageBoard>
      );
  }

  return <div className="elimination_board">{board}</div>;
}
