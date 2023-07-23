import StageListItem from "./StageListItem";
import { useSelector } from "react-redux/es/hooks/useSelector";
import { useDispatch } from "react-redux/es/hooks/useDispatch";
import EliminationInfo from "../../../../../jsons/EliminationInfo.json";
import { setStageNum } from "../stageControllerSlice";

const groups = EliminationInfo.groups;

export default function StageList() {
  const dispatch = useDispatch();
  const groupShown = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);

  const stages = groups[groupShown].stages;
  dispatch(setStageNum(stages.length));

  let items = [];

  for (let i = 0; i <= stageNum + 1; i++) {
    items.push(<StageListItem stageId={i}></StageListItem>);
  }

  return (
    <ul className="stage_list " style={{ height: items.length * 40 + "px" }}>
      {items}
    </ul>
  );
}
