import { useDispatch, useSelector } from "react-redux";
import { toggleGroupList, selectGroup } from "./groupListButtonSlice";

let groupNames = [
    '新生',
    '大專30m',
    '公開30m',
    '公開70m',
]

function GroupList(){
    return <ul className="group_list sub_game_bar_list">
    <GroupListButton></GroupListButton>

        {groupNames.map((groupName) => <GroupListItem name = {groupName}></GroupListItem>)}
    </ul>
}

interface GroupListItem{
    name: string;
}

function GroupListItem(props : GroupListItem){
    const groupListHidden = useSelector((state:any) => state.groupListButton.groupListHidden)
    const dispatch = useDispatch()
    let className = "group_list_item " + groupListHidden;
    return <li className={className} key={props.name} onClick={() => dispatch(selectGroup(props.name))}>{props.name}</li>
}

function GroupListButton(){
    const groupShown = useSelector((state:any) => state.groupListButton.groupShown)
    const dispatch = useDispatch()

    return <button className="group_list_button sub_game_bar_list_button" onClick = {() => dispatch(toggleGroupList())}>{groupShown}</button>
}

export default GroupList;