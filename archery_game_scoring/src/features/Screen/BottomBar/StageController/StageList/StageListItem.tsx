import { useSelector } from "react-redux/es/hooks/useSelector";
import { useDispatch } from "react-redux/es/hooks/useDispatch";
import { selectStage } from "../stageControllerSlice";

interface Props {
  stageId: number;
}

export default function StageListItem(props: Props) {
  const stageListIsHidden = useSelector(
    (state: any) => state.stageController.stageListIsHidden
  );
  const stageNum = useSelector((state: any) => state.stageController.stageNum);

  const dispatch = useDispatch();
  let maxHeight: string;
  if (stageListIsHidden === true) {
    maxHeight = "0px";
  } else {
    maxHeight = "200px";
  }

  let content: string;

  switch (props.stageId) {
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
      content = "Stage " + props.stageId;
    }
  }

  return (
    <li
      className={"stage_list_item"}
      style={{
        maxHeight: maxHeight,
        borderBottom: maxHeight == "0px" ? "0px" : "1px solid white",
      }}
      key={props.stageId}
      onClick={() => dispatch(selectStage(props.stageId))}
    >
      {content}
    </li>
  );
}
