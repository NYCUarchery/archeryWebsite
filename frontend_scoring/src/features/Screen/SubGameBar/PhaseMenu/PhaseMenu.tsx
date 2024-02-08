import { useState } from "react";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Button } from "@mui/material";

import { useSelector, useDispatch } from "react-redux";
import { selectPhase } from "./phaseMenuSlice";

import useGetCompetition from "../../../../QueryHooks/useGetCompetition";

const phaseNames = ["資格賽", "對抗賽", "團體對抗賽", "混雙對抗賽"];

export default function PhaseMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useDispatch();
  const competitionId = useSelector((state: any) => state.game.competitionID);
  const phaseShown = useSelector((state: any) => state.phaseMenu.phaseShown);
  const { data: competition } = useGetCompetition(competitionId);

  let items = [];

  if (competition?.qualification_is_active) {
    items.push(
      <MenuItem
        key="Qualification"
        onClick={() =>
          dispatch(
            selectPhase({ phaseShown: 0, phaseKindShown: "Qualification" })
          )
        }
      >
        {phaseNames[0]}
      </MenuItem>
    );
  } else {
    return (
      <Button color="primary" variant="contained">
        沒有資格賽？？
      </Button>
    );
  }
  if (competition?.elimination_is_active) {
    items.push(
      <MenuItem
        key="Elimination"
        onClick={() =>
          dispatch(
            selectPhase({ phaseShown: 1, phaseKindShown: "Elimination" })
          )
        }
      >
        {phaseNames[1]}
      </MenuItem>
    );
  }

  if (competition?.team_elimination_is_active) {
    items.push(
      <MenuItem
        key="TeamElimination"
        onClick={() =>
          dispatch(
            selectPhase({ phaseShown: 2, phaseKindShown: "TeamElimination" })
          )
        }
      >
        {phaseNames[2]}
      </MenuItem>
    );
  }
  if (competition?.mixed_elimination_is_active) {
    items.push(
      <MenuItem
        key="MixedElimination"
        onClick={() =>
          dispatch(
            selectPhase({ phaseShown: 3, phaseKindShown: "MixedElimination" })
          )
        }
      >
        {phaseNames[3]}
      </MenuItem>
    );
  }

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        {phaseNames[phaseShown]}
      </Button>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {items}
      </Menu>
    </>
  );
}
