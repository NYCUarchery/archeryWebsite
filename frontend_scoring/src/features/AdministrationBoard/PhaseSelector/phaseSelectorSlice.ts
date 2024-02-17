import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  phaseShown: 0,
};

const phaseSelectorSlice = createSlice({
  name: "phaseSelector",
  initialState: initialState,
  reducers: {
    setPhaseShown: (state, action) => {
      state.phaseShown = action.payload;
    },
  },
});

export const adminPhaseSelectorReducer = phaseSelectorSlice.reducer;
export const setPhaseShown = phaseSelectorSlice.actions.setPhaseShown;
