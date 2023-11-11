import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groupShown: 1,
  groupListIsHidden: true,
};

const groupListButtonSlice = createSlice({
  name: "groupListButton",
  initialState,
  reducers: {
    toggleGroupList: (state) => {
      state.groupListIsHidden === true
        ? (state.groupListIsHidden = false)
        : (state.groupListIsHidden = true);
    },
    selectGroup: (state, action) => {
      state.groupShown = action.payload;
      state.groupListIsHidden = true;
    },
  },
});

export const groupListButtonReducer = groupListButtonSlice.reducer;
export const toggleGroupList = groupListButtonSlice.actions.toggleGroupList;
export const selectGroup = groupListButtonSlice.actions.selectGroup;
