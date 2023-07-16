import { useDispatch, useSelector } from "react-redux";
import { selectPhase, togglePhaseList } from "./phaseListButtonSlice";

let phaseNames = [
    '資格賽',
    '對抗賽',
    '團體對抗賽',
]

function PhaseList(){
    return<ul className="phase_list sub_game_bar_list">
    <PhaseListButton></PhaseListButton>

        {phaseNames.map((phaseName) => <PhaseListItem name = {phaseName}></PhaseListItem>)}
    </ul>
}

interface PhaseListItem{
    name: string;
}

function PhaseListItem(props : PhaseListItem){
    const phaseListHidden = useSelector((state:any) => state.phaseListButton.phaseListHidden)
    const dispatch = useDispatch();
    let className = "phase_list_item " + phaseListHidden;
    return <li className={className} key={props.name} onClick={() => dispatch(selectPhase(props.name))}>{props.name}</li>

}

function PhaseListButton(){
    const phaseShown = useSelector((state:any) => state.phaseListButton.phaseShown)
    const dispatch = useDispatch()

    return <button className="phase_list_button sub_game_bar_list_button" onClick = {() => dispatch(togglePhaseList())}>{phaseShown}</button>
}

export default PhaseList;