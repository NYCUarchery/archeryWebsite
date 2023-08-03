import { useSelector } from "react-redux/es/hooks/useSelector";
import { useDispatch } from "react-redux/es/hooks/useDispatch";
import { toggleStageList } from "./stageControllerSlice";

interface Props {
  phaseKind: string;
}

export default function StageListButton(props: Props) {
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);
  const dispatch = useDispatch();

  let content: string;

  if (props.phaseKind === "Elimination") {
    switch (stageShown) {
      case 0: {
        content = "Players";
        break;
      }
      case stageNum - 1: {
        content = "Results";
        break;
      }
      case stageNum - 2: {
        content = "Finals";
        break;
      }
      case stageNum - 3: {
        content = "Semi-Finals";
        break;
      }
      default: {
        content = "Stage " + stageShown;
      }
    }
  } else {
    content = "Stage " + (stageShown + 1);
  }

  return (
    <button
      className="stage_list_button "
      onClick={() => dispatch(toggleStageList())}
    >
      {content}
    </button>
  );
}
