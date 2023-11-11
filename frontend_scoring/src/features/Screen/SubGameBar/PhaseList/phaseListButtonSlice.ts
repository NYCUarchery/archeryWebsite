import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  phaseShown: 0,
  phaseKindShown: "Qualification",
  phaseListIsHidden: true,
};

const phaseListButtonSlice = createSlice({
  name: "phaseListButton",
  initialState,
  reducers: {
    togglePhaseList: (state) => {
      state.phaseListIsHidden === true
        ? (state.phaseListIsHidden = false)
        : (state.phaseListIsHidden = true);
    },
    selectPhase: (state, action) => {
      state.phaseShown = action.payload.phase;
      state.phaseKindShown = action.payload.phaseKind;
      state.phaseListIsHidden = true;
    },
  },
});

export const phaseListButtonReducer = phaseListButtonSlice.reducer;
export const togglePhaseList = phaseListButtonSlice.actions.togglePhaseList;
export const selectPhase = phaseListButtonSlice.actions.selectPhase;
