import { Box } from "@mui/material";
import PhaseSelector from "../PhaseSelector/PhaseSelector";
import { useSelector } from "react-redux";
import Qualification from "./Qualification/Qualification";
import Elimiantion from "./Elimination/Elimination";
import useGetSimpleCompetition from "../../../QueryHooks/useGetSimpleCompetition";
import GroupsMenu from "../GameStructureBoard/GroupsMenu/GroupsMenu";

const teamSizes = [0, 1, 3, 2];

export default function ProgressBoard() {
  const phaseShown = useSelector(
    (state: any) => state.adminPhaseSelector.phaseShown
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition, isLoading } =
    useGetSimpleCompetition(competitionID);

  if (isLoading || !competition)
    return (
      <>
        <PhaseSelector></PhaseSelector>
        <GroupsMenu></GroupsMenu>
      </>
    );

  const groups = competition.group_datas;
  const teamSize = teamSizes[phaseShown];
  const eliminationID = extractEliminationID(groups, groupShown, teamSize);

  let board = <Qualification></Qualification>;
  switch (phaseShown) {
    case 0:
      board = <Qualification></Qualification>;
      break;
    default:
      board = (
        <Elimiantion
          teamSize={teamSize}
          eliminationID={eliminationID}
        ></Elimiantion>
      );
  }
  if (!eliminationID && phaseShown !== 0) {
    board = <h1>載入對抗賽中</h1>;
  }

  return (
    <>
      <PhaseSelector></PhaseSelector>
      <Box
        className="process_board"
        sx={{
          display: "flex",
          width: "100%",
        }}
      >
        {board}
      </Box>
    </>
  );
}

const extractEliminationID = (
  groups: any,
  groupShown: number,
  teamSize: number
) => {
  const group = groups.find((g: any) => g.group_id === groupShown);

  if (!group) return undefined;
  const eliminationID = group.elimination_datas?.find(
    (e: any) => e.team_size === teamSize
  )?.elimination_id;
  return eliminationID;
};
