import { useDispatch, useSelector } from "react-redux";
import { toggleGroupList, selectGroup } from "./groupListButtonSlice";
import { useEffect } from "react";

interface Props {
  groups: any;
}

function GroupList({ groups }: Props) {
  let items = [];
  const groupShown = useSelector(
    (state: any) => state.groupListButton.groupShown
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (groups.length === 1) dispatch(selectGroup(groups[0].id));
    dispatch(selectGroup(groups[1].id));
  }, []);

  for (let i = 1; i < groups.length; i++) {
    items.push(
      <GroupListItem
        key={i}
        groupId={groups[i].id}
        name={groups[i].group_name}
      ></GroupListItem>
    );
  }

  const name = groups.find((g: any) => g.id === groupShown)?.group_name;
  return (
    <ul className="group_list sub_game_bar_list">
      <GroupListButton name={name}></GroupListButton>
      {items}
    </ul>
  );
}

interface GroupListItem {
  groupId: number;
  name: string;
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
      {props.name}
    </li>
  );
}
interface GroupListButtonProps {
  name: string;
}

function GroupListButton({ name }: GroupListButtonProps) {
  const dispatch = useDispatch();
  return (
    <button
      className="group_list_button sub_game_bar_list_button"
      onClick={() => dispatch(toggleGroupList())}
    >
      {name}
    </button>
  );
}

export default GroupList;
