import { useSelector } from "react-redux/es/hooks/useSelector";
import GroupList from "./GroupList/GroupList";
import PhaseList from "./PhaseList/PhaseList";
import GroupPhaseTag from "./GroupPhaseTag";
import AdminBoardTabs from "./AdminBoardTabs/AdminBoardTabs";

function SubGamesBar() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  let content: any;

  switch (boardShown) {
    case "score":
      content = (
        <>
          <GroupList></GroupList>
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
