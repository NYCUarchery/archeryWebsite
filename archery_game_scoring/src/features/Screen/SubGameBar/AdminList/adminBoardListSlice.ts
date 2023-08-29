import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  adminBoardShown: 0,
  adminBoardList: ["main", "scoreEdition", "participants"],
  adminBoardListIsHidden: true,
};

const adminBoardListSlice = createSlice({
  name: "adminBoardList",
  initialState: initialState,
  reducers: {
    toggleAdminBoardList: (state) => {
      state.adminBoardListIsHidden = !state.adminBoardListIsHidden;
    },
    selectAdminBoard: (state, action) => {
      state.adminBoardShown = action.payload;
      state.adminBoardListIsHidden = true;
    },
  },
});

export const adminBoardListReducer = adminBoardListSlice.reducer;
export const toggleAdminBoardList =
  adminBoardListSlice.actions.toggleAdminBoardList;
export const selectAdminBoard = adminBoardListSlice.actions.selectAdminBoard;
