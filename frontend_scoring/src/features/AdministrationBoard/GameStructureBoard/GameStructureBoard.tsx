import SubboardController from "./SubboardController/SubboardController";
import { useSelector } from "react-redux";
import ActivationBoard from "./ActivationBoard/ActivationBoard";
import QualifcationBoard from "./QualificationBoard/QualificationBoard";
import GroupEliminationBoard from "./GroupEliminationBoard/GroupEliminationBoard";
import useGetSimpleCompetition from "../../../QueryHooks/useGetSimpleCompetition";
import GroupsMenu from "./GroupsMenu/GroupsMenu";
const teamSizes = [0, 0, 1, 3, 2];

export default function GameStructureBoard() {
  const subboardShown = useSelector(
    (state: any) => state.gameStructureBoard.subboardShown
  );
  const subboardNames = useSelector(
    (state: any) => state.gameStructureBoard.subboardNames
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const { data: competition, isLoading } =
    useGetSimpleCompetition(competitionID);

  if (isLoading || !competition) return <GroupsMenu />;

  const teamSize = teamSizes[subboardShown];
  const eliminationID = extractEliminationID(
    competition.group_datas,
    groupShown,
    teamSize
  );

  let board = getSubboard(
    subboardShown,
    teamSize,
    subboardNames,
    eliminationID
  );

  return (
    <div className="game_structure_board">
      <SubboardController></SubboardController>
      {board}
    </div>
  );
}

function getSubboard(
  subboardShown: number,
  teamSize: number,
  subboardNames: string[],
  eliminationID: number
) {
  let board;
  switch (subboardNames[subboardShown]) {
    case subboardNames[0]:
      board = <ActivationBoard></ActivationBoard>;
      break;
    case subboardNames[1]:
      board = (
        <>
          <GroupsMenu />
          <QualifcationBoard></QualifcationBoard>;
        </>
      );

      break;
    default:
      board = (
        <>
          <GroupsMenu />
          <GroupEliminationBoard
            teamSize={teamSize}
            eliminationID={eliminationID}
          ></GroupEliminationBoard>
        </>
      );
  }
  return board;
}

const extractEliminationID = (
  groups: any,
  groupShown: number,
  teamSize: number
) => {
  const group = groups.find((g: any) => g.group_id === groupShown);

  if (!group) return undefined;
  const eliminationID = group.elimination_datas.find(
    (e: any) => e.team_size === teamSize
  )?.elimination_id;
  return eliminationID;
};
