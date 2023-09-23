import { createSlice } from "@reduxjs/toolkit";
import GroupInfo from "../../jsons/GroupInfo.json";
import GameInfo from "../../jsons/GameInfo.json";
import PhaseInfo from "../../jsons/PhaseInfo.json";

const initialState = {
  hostId: GameInfo.host_id,
  currentPhase: GameInfo.current_phase,
  currentPhaseKind: GameInfo.current_phase_kind,
  currentStage: GameInfo.current_stage,
  phases: PhaseInfo.phases,
  groupNames: GroupInfo.group_names,

  qualificationIsActive: GameInfo.qualification_is_active,
  eliminationIsActive: GameInfo.elimination_is_active,
  teamEliminationIsActive: GameInfo.team_elimination_is_active,
  mixedEliminationIsActive: GameInfo.mixed_elimination_is_active,
};

const gameSlice = createSlice({
  name: "game",
  initialState: initialState,
  reducers: {
    progressPhase: (state) => {
      state.currentPhase++;
    },
    regressPhase: (state) => {
      state.currentPhase--;
    },
    progressStage: (state) => {
      state.currentStage++;
    },
    regressStage: (state) => {
      state.currentStage--;
    },
    activatePhase: (state, action) => {
      switch (action.payload as string) {
        case "Qualification":
          state.qualificationIsActive = true;
          break;
        case "Elimination":
          state.eliminationIsActive = true;
          break;
        case "Team Elimination":
          state.teamEliminationIsActive = true;
          break;
        case "Mixed Elimination":
          state.mixedEliminationIsActive = true;
          break;
      }
    },
  },
});

export const gameReducer = gameSlice.reducer;
export const progressPhase = gameSlice.actions.progressPhase;
export const regressPhase = gameSlice.actions.regressPhase;
export const progressStage = gameSlice.actions.progressStage;
export const regressStage = gameSlice.actions.regressStage;
export const activatePhase = gameSlice.actions.activatePhase;
