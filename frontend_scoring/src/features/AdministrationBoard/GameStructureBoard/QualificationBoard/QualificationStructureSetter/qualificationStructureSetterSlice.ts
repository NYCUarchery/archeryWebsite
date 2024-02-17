import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  startLane: 0,
  endLane: 0,
  advancingNum: 0,
};

const qualificationStructureSetterSlice = createSlice({
  name: "qualificationStructureSetter",
  initialState,
  reducers: {
    initialize: (state, action) => {
      state.startLane = action.payload.startLane;
      state.endLane = action.payload.endLane;
      state.advancingNum = action.payload.advancingNum;
    },
    setStartLane(state, action) {
      state.startLane = action.payload;
    },
    setEndLane(state, action) {
      state.endLane = action.payload;
    },
    setAdvancingNum(state, action) {
      state.advancingNum = action.payload;
    },
  },
});

export const qualificationStructureSetterReducer =
  qualificationStructureSetterSlice.reducer;
export const setStartLane =
  qualificationStructureSetterSlice.actions.setStartLane;
export const setEndLane = qualificationStructureSetterSlice.actions.setEndLane;
export const setAdvancingNum =
  qualificationStructureSetterSlice.actions.setAdvancingNum;
export const initialize = qualificationStructureSetterSlice.actions.initialize;
