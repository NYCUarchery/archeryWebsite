import { useDispatch, useSelector } from "react-redux";
import { toggleGroupList, selectGroup } from "./groupListButtonSlice";
import GroupInfo from "../../../../jsons/GroupInfo.json";

let groups = GroupInfo.groups;

function GroupList() {
  let items = [];

  for (let i = 1; i < groups.length; i++) {
    items.push(<GroupListItem key={i} groupId={i}></GroupListItem>);
  }

  return (
    <ul className="group_list sub_game_bar_list">
      <GroupListButton></GroupListButton>

      {items}
    </ul>
  );
}

interface GroupListItem {
  groupId: number;
}

function GroupListItem(props: GroupListItem) {
  const groupListIsHidden = useSelector(
    (state: any) => state.groupListButton.groupListIsHidden
  );
  const dispatch = useDispatch();
  let maxHeight: string;
  if (groupListIsHidden == true) {
    maxHeight = "0px";
  } else {
    maxHeight = "200px";
  }
  return (
    <li
      className={"group_list_item"}
      style={{
        maxHeight: maxHeight,
      }}
      onClick={() => dispatch(selectGroup(props.groupId))}
    >
      {groups[props.groupId]}
    </li>
  );
}

function GroupListButton() {
  const groupShown = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  const dispatch = useDispatch();
  return (
    <button
      className="group_list_button sub_game_bar_list_button"
      onClick={() => dispatch(toggleGroupList())}
    >
      {groups[groupShown]}
    </button>
  );
}

export default GroupList;
