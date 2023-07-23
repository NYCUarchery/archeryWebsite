import { useSelector } from "react-redux/es/hooks/useSelector";
import { useDispatch } from "react-redux/es/hooks/useDispatch";
import { toggleStageList } from "./stageControllerSlice";

export default function StageListButton() {
  const stageShown = useSelector(
    (state: any) => state.stageController.stageShown
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);
  const dispatch = useDispatch();
  let content: string;

  switch (stageShown) {
    case 0: {
      content = "Players";
      break;
    }
    case stageNum + 1: {
      content = "Results";
      break;
    }
    case stageNum: {
      content = "Finals";
      break;
    }
    case stageNum - 1: {
      content = "Semi-Finals";
      break;
    }
    default: {
      content = "Stage " + stageShown;
    }
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
