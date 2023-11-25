import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPlayerId: 0,
};

const groupBoardSlice = createSlice({
  name: "qualificationStructureGroupBoard",
  initialState,
  reducers: {
    setSelectedPlayerId(state, action) {
      state.selectedPlayerId = action.payload;
    },
  },
});

export const qualificationStructureGroupBoardReducer = groupBoardSlice.reducer;
export const setSelectedPlayerId = groupBoardSlice.actions.setSelectedPlayerId;
