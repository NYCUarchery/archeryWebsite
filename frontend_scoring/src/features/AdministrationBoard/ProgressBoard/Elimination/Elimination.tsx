import { Box } from "@mui/material";
import GroupsMenu from "../../GameStructureBoard/GroupsMenu/GroupsMenu";
import StageAddButton from "./StageAddButton";
import StagesBlock from "./StagesBlock/StagesBlock";
import useGetEliminationWithAllScores from "../../../../QueryHooks/useGetEliminationWithAllScores";
import EndSwitch from "./EndSwitch";
import OverviewBlock from "./OverviewBlock/OverviewBlock";

interface Props {
  teamSize: number;
  eliminationID: number;
}
export default function Elimiantion({ eliminationID }: Props) {
  const { data: elimination, isLoading } =
    useGetEliminationWithAllScores(eliminationID);

  if (isLoading) return <></>;

  return (
    <>
      <Box>
        <GroupsMenu></GroupsMenu>
        <EndSwitch elimination={elimination}></EndSwitch>
        <StageAddButton eliminationID={eliminationID}></StageAddButton>
        <OverviewBlock elimination={elimination}></OverviewBlock>
      </Box>

      <StagesBlock stages={elimination.stages}></StagesBlock>
    </>
  );
}
