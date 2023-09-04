import PlayerList from "./PlayerList/PlayerList";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setGroups } from "../GroupsBoardSlice";

export default function PlayerLists() {
  const dispatch = useDispatch();
  const players = useSelector((state: any) => state.participants.players);
  const groups = useSelector((state: any) => state.groupsBoard.groups);
  const groupNames = useSelector((state: any) => state.groupsBoard.groupNames);
  const groupsNum = useSelector((state: any) => state.groupsBoard.groupsNum);

  useEffect(() => {
    dispatch(setGroups(players));
  }, []);

  let playerLists = [];

  for (let i = 0; i < groupsNum; i++) {
    playerLists.push(
      <PlayerList groupName={groupNames[i]} players={groups[i]} />
    );
  }

  return <div className="player_lists">{playerLists}</div>;
}
