import { useSelector } from "react-redux/es/hooks/useSelector";

import Box from "@mui/material/Box";

import GroupMenu from "./GroupMenu/GroupMenu";
import PhaseMenu from "./PhaseMenu/PhaseMenu";
import GroupPhaseTag from "./GroupPhaseTag";
import AdminBoardTabs from "./AdminBoardTabs/AdminBoardTabs";
import useGetGroupsWithPlayers from "../../../QueryHooks/useGetGroupsWithPlayers";
import { Group } from "../../../QueryHooks/types/Competition";

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
          <GroupMenu groups={groups as Group[]}></GroupMenu>
          <PhaseMenu />
        </>
      );
      break;
    case "recording":
      content = <GroupPhaseTag></GroupPhaseTag>;
      break;
    case "administration":
      content = <AdminBoardTabs></AdminBoardTabs>;
  }

  return <Box sx={{ backgroundColor: "primary.main" }}>{content}</Box>;
}

export default SubGamesBar;
