import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  adminBoardShown: 0,
  adminBoardTabs: [
    "Main",
    "Participants",
    "Groups",
    "Game Structure",
    "Process",
    "Score Edition",
  ],
  adminBoardTabsIsHidden: true,
};

const adminBoardTabsSlice = createSlice({
  name: "adminBoardTabs",
  initialState: initialState,
  reducers: {
    toggleAdminBoardList: (state) => {
      state.adminBoardTabsIsHidden = !state.adminBoardTabsIsHidden;
    },
    selectAdminBoard: (state, action) => {
      state.adminBoardShown = action.payload;
      state.adminBoardTabsIsHidden = true;
    },
  },
});

export const adminBoardTabsReducer = adminBoardTabsSlice.reducer;
export const toggleAdminBoardList =
  adminBoardTabsSlice.actions.toggleAdminBoardList;
export const selectAdminBoard = adminBoardTabsSlice.actions.selectAdminBoard;
