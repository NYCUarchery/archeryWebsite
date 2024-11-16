import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  groupIndex: 1,
};

export const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    setGroupIndex: (state, action: PayloadAction<number>) => {
      state.groupIndex = action.payload;
    },
  },
});

export const { setGroupIndex } = progressSlice.actions;
export default progressSlice.reducer;
