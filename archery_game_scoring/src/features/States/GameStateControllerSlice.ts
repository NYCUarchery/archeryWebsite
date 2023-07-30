import { createSlice } from "@reduxjs/toolkit";
import GroupInfo from "../../jsons/GroupInfo.json";
import PhaseInfo from "../../jsons/PhaseInfo.json";

const initialState = {
  currentPhase: 0,
  currentStage: 0,
  phases: PhaseInfo.phases,
  groups: GroupInfo.groups,
};

const gameStateControllerSlice = createSlice({
  name: "gameStateController",
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
  },
});

export const gameStateControllerReducer = gameStateControllerSlice.reducer;
export const progressPhase = gameStateControllerSlice.actions.progressPhase;
export const regressPhase = gameStateControllerSlice.actions.regressPhase;
export const progressStage = gameStateControllerSlice.actions.progressStage;
export const regressStage = gameStateControllerSlice.actions.regressStage;
