import { useDispatch, useSelector } from "react-redux";
import { selectPhase, togglePhaseList } from "./phaseListButtonSlice";
import PhaseInfo from "../../../../jsons/PhaseInfo.json";

let phases = PhaseInfo.phases;

function PhaseList() {
  let items = [];

  for (let i = 0; i < phases.length; i++) {
    items.push(<PhaseListItem phaseId={i}></PhaseListItem>);
  }

  return (
    <ul className="phase_list sub_game_bar_list">
      <PhaseListButton></PhaseListButton>
      {items}
    </ul>
  );
}

interface PhaseListItem {
  phaseId: number;
}

function PhaseListItem(props: PhaseListItem) {
  const phaseListIsHidden = useSelector(
    (state: any) => state.phaseListButton.phaseListIsHidden
  );
  const dispatch = useDispatch();

  let maxHeight: string;
  phaseListIsHidden === true ? (maxHeight = "0px") : (maxHeight = " 150px");

  return (
    <li
      className={"phase_list_item"}
      style={{
        maxHeight: maxHeight,
      }}
      key={props.phaseId}
      onClick={() => dispatch(selectPhase(props.phaseId))}
    >
      {phases[props.phaseId]}
    </li>
  );
}

function PhaseListButton() {
  const phaseShown = useSelector(
    (state: any) => state.phaseListButton.phaseShown
  );
  const dispatch = useDispatch();

  return (
    <button
      className="phase_list_button sub_game_bar_list_button"
      onClick={() => dispatch(togglePhaseList())}
    >
      {phases[phaseShown]}
    </button>
  );
}

export default PhaseList;
