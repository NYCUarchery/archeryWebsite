import { Box } from "@mui/material";
import GroupsMenu from "../../GameStructureBoard/GroupsMenu/GroupsMenu";
import StageAddButton from "./StageAddButton";
import StagesBlock from "./StagesBlock/StagesBlock";
import useGetEliminationWithAllScores from "../../../../QueryHooks/useGetEliminationWithAllScores";

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
        <StageAddButton eliminationID={eliminationID}></StageAddButton>
      </Box>

      <StagesBlock stages={elimination.stages}></StagesBlock>
    </>
  );
}
