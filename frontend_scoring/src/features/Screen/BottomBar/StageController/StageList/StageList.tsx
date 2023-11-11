import StageListItem from "./StageListItem";
import { useEffect } from "react";
import { useSelector } from "react-redux/es/hooks/useSelector";
import { useDispatch } from "react-redux/es/hooks/useDispatch";
import EliminationInfo from "../../../../../jsons/EliminationInfo.json";
import LaneInfo from "../../../../../jsons/LaneInfo.json";
import { setStageNum } from "../stageControllerSlice";

const groups = EliminationInfo.groups;

interface Props {
  phaseKind: string;
}

export default function StageList(props: Props) {
  const dispatch = useDispatch();
  const stageListIsHidden = useSelector(
    (state: any) => state.stageController.stageListIsHidden
  );
  const groupShown = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);

  let stages: any;
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);

  useEffect(() => {
    return () => {
      if (boardShown === "score") {
        stages = groups[groupShown].stages;
        dispatch(setStageNum(stages.length + 2));
      } else if (boardShown === "recording") {
        stages = LaneInfo.stages;
        dispatch(setStageNum(stages.length));
      }
    };
  }, [boardShown]);

  let items = [];

  for (let i = 0; i < stageNum; i++) {
    items.push(
      <StageListItem
        stageId={i}
        key={i}
        phaseKind={props.phaseKind}
      ></StageListItem>
    );
  }

  return (
    <ul
      className="stage_list "
      style={{
        height: stageListIsHidden ? "0px" : items.length * 40 + "px",
        bottom: 40 + items.length + "px",
      }}
    >
      {items}
    </ul>
  );
}
