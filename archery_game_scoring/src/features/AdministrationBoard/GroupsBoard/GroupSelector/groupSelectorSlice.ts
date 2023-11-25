import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedGroupId: null as number | null,
};

const groupSelectorSlice = createSlice({
  name: "groupSelector",
  initialState,
  reducers: {
    selectGroupId: (state, action) => {
      state.selectedGroupId = action.payload;
    },
  },
});

export const groupSelectorReducer = groupSelectorSlice.reducer;
export const selectGroupId = groupSelectorSlice.actions.selectGroupId;
