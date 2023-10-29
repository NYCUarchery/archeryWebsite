import PlayerList from "./PlayerList/PlayerList";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setGroups } from "../groupsBoardSlice";

export default function PlayerLists() {
  const dispatch = useDispatch();
  const players = useSelector((state: any) => state.participants.players);
  const groups = useSelector((state: any) => state.groupsBoard.groups);
  const groupsNum = useSelector((state: any) => state.groupsBoard.groupsNum);

  useEffect(() => {
    dispatch(setGroups(players));
  }, []);

  let playerLists = [];

  for (let i = 0; i < groupsNum; i++) {
    playerLists.push(<PlayerList key={i} players={groups[i]} groupId={i} />);
  }

  return <div className="player_lists">{playerLists}</div>;
}
