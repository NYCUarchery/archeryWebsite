import { createSlice } from "@reduxjs/toolkit";

type PhaseMenuState = {
  phaseShown: number;
  phaseKindShown: "Qualification" | "Elimination";
};

const initialState: PhaseMenuState = {
  phaseShown: 4,
  phaseKindShown: "Qualification",
};

const phaseMenuSlice = createSlice({
  name: "phaseMenu",
  initialState,
  reducers: {
    selectPhase: (state, action) => {
      const payload = action.payload as PhaseMenuState;
      state.phaseShown = payload.phaseShown;
      state.phaseKindShown = payload.phaseKindShown;
    },
  },
});

export const phaseMenuReducer = phaseMenuSlice.reducer;
export const selectPhase = phaseMenuSlice.actions.selectPhase;
