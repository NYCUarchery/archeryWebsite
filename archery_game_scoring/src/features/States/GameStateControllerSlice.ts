import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentPhase: 0,
  currentStage: 0,
};

const GameStateControllerSlice = createSlice({
  name: "GameStateController",
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

// export what's needed
export const GameStateControllerReducer = GameStateControllerSlice.reducer;
export const progressPhase = GameStateControllerSlice.actions.progressPhase;
export const regressPhase = GameStateControllerSlice.actions.regressPhase;
export const progressStage = GameStateControllerSlice.actions.progressStage;
export const regressStage = GameStateControllerSlice.actions.regressStage;
