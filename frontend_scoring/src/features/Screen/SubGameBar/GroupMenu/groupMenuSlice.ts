import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groupShown: 0,
};

const groupMenuSlice = createSlice({
  name: "groupMenu",
  initialState,
  reducers: {
    selectGroup: (state, action) => {
      state.groupShown = action.payload;
    },
  },
});

export const groupMenuReducer = groupMenuSlice.reducer;
export const selectGroup = groupMenuSlice.actions.selectGroup;
