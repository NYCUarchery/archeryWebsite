import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPlayerID: null,
};

const scoreControllerSlice = createSlice({
  name: "scoreController",
  initialState,
  reducers: {
    setSelectedPlayerID: (state, action) => {
      state.selectedPlayerID = action.payload;
    },
  },
});

export const scoreControllerReducer = scoreControllerSlice.reducer;
export const setSelectedPlayerID =
  scoreControllerSlice.actions.setSelectedPlayerID;
