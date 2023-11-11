import { createSlice } from "@reduxjs/toolkit";

const initialState = {};

const eliminationBoardSlice = createSlice({
  name: "eliminationBoard",
  initialState,
  reducers: {},
});

export const eliminationBoardSliceReducer = eliminationBoardSlice.reducer;
