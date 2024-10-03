import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  selectedOrder: 0,
};

export const qualificationScoringSlice = createSlice({
  name: "QualificationScoring",
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<number>) => {
      state.selectedOrder = action.payload;
    },
  },
});

export const { setSelectedOrder } = qualificationScoringSlice.actions;
export default qualificationScoringSlice.reducer;
