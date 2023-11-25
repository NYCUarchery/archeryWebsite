import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedGroupID: null as number | null,
  selectedPlayersLength: 0,
};

const groupSelectorSlice = createSlice({
  name: "groupSelector",
  initialState,
  reducers: {
    selectGroup: (state, action) => {
      state.selectedGroupID = action.payload.groupID;
      state.selectedPlayersLength = action.payload.playersLength;
    },
  },
});

export const groupSelectorReducer = groupSelectorSlice.reducer;
export const selectGroup = groupSelectorSlice.actions.selectGroup;
