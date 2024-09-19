import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  groupIndex: 1,
};

export const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {
    setGroupIndex: (state, action: PayloadAction<number>) => {
      state.groupIndex = action.payload;
    },
  },
});

export const { setGroupIndex } = scheduleSlice.actions;
export default scheduleSlice.reducer;
