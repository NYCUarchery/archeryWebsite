import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  selectedOrder: 0,
};

export const qualificationScoringSlice = createSlice({
  name: "QualificationScoring",
  initialState,
  reducers: {
    setSelectedIndex: (state, action: PayloadAction<number>) => {
      state.selectedOrder = action.payload;
    },
  },
});

export const { setSelectedIndex } = qualificationScoringSlice.actions;
export default qualificationScoringSlice.reducer;
