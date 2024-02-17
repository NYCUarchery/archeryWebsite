import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setSubboardShown } from "../gameStructureBoardSlice";
import useGetCompetition from "../../../../QueryHooks/useGetCompetition";

export default function SubboardController() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition } = useGetCompetition(competitionID);
  const dispatch = useDispatch();
  const subboardNames = useSelector(
    (state: any) => state.gameStructureBoard.subboardNames
  );
  const subboardShown = useSelector(
    (state: any) => state.gameStructureBoard.subboardShown
  );
  if (!competition) return <></>;
  const qualificationIsActive = competition.qualification_is_active;
  const eliminationIsActive = competition.elimination_is_active;
  const teamEliminationIsActive = competition.team_elimination_is_active;
  const mixedEliminationIsActive = competition.mixed_elimination_is_active;

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSubboardShown: number | null
  ) => {
    dispatch(setSubboardShown(newSubboardShown));
  };

  let buttons = [];
  let buttonsIsActive = [];

  for (let i = 0; i < subboardNames.length; i++) {
    buttonsIsActive.push(true);
    switch (i) {
      case 1:
        buttonsIsActive[i] = qualificationIsActive;
        break;
      case 2:
        buttonsIsActive[i] = eliminationIsActive;
        break;
      case 3:
        buttonsIsActive[i] = teamEliminationIsActive;
        break;
      case 4:
        buttonsIsActive[i] = mixedEliminationIsActive;
        break;
    }
  }

  for (let i = 0; i < subboardNames.length; i++) {
    buttons.push(
      <ToggleButton
        disabled={!buttonsIsActive[i]}
        className="subboard_controller_button"
        key={i}
        value={i}
      >
        {subboardNames[i]}
      </ToggleButton>
    );
  }

  return (
    <ToggleButtonGroup
      className="subboard_controller"
      exclusive
      value={subboardShown}
      onChange={handleChange}
      fullWidth
    >
      {buttons}
    </ToggleButtonGroup>
  );
}
