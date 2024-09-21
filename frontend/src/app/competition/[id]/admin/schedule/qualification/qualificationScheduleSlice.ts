import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  startLane: 0,
  endLane: 0,
  advancingNum: 0,
};

export const qualificationScheduleSlice = createSlice({
  name: "qualificationSchedule",
  initialState,
  reducers: {
    setStartLane: (state, action: PayloadAction<number>) => {
      state.startLane = action.payload;
    },
    setEndLane: (state, action: PayloadAction<number>) => {
      state.endLane = action.payload;
    },
    setAdvancingNum: (state, action: PayloadAction<number>) => {
      state.advancingNum = action.payload;
    },
  },
});

export const { setStartLane, setEndLane, setAdvancingNum } =
  qualificationScheduleSlice.actions;
export default qualificationScheduleSlice.reducer;
