import { useSelector } from "react-redux/es/hooks/useSelector";
import GroupList from "./GroupList/GroupList";
import PhaseList from "./PhaseList/PhaseList";
import GroupPhaseTag from "./GroupPhaseTag";
import AdminBoardTabs from "./AdminBoardTabs/AdminBoardTabs";
import useGetGroupsWithPlayers from "../../../QueryHooks/useGetGroupsWithPlayers";

function SubGamesBar() {
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);
  let content: any;
  const comepetitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups, isLoading } = useGetGroupsWithPlayers(comepetitionID);

  if (isLoading) return <></>;

  switch (boardShown) {
    case "score":
      content = (
        <>
          <GroupList groups={groups}></GroupList>
          <PhaseList></PhaseList>
        </>
      );
      break;
    case "recording":
      content = <GroupPhaseTag></GroupPhaseTag>;
      break;
    case "administration":
      content = <AdminBoardTabs></AdminBoardTabs>;
  }

  return <div className="sub_game_bar">{content}</div>;
}

export default SubGamesBar;
