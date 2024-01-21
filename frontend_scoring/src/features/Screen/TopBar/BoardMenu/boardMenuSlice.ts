import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  boardShown: "score",
  avaliableBoards: ["score"],
};

const boardMenuSlice = createSlice({
  name: "boardMenu",
  initialState: initialState,
  reducers: {
    selectBoard: (state, action) => {
      state.boardShown = action.payload;
    },
    initBoardMenu: (state, action) => {
      const user = action.payload;
      if (user.role === "admin" && user.status === "approved") {
        state.avaliableBoards = ["score", "administration"];
      } else if (user.role === "player" && user.status === "approved") {
        state.avaliableBoards = ["score", "recording"];
      }
    },
  },
});

export const boardMenuReducer = boardMenuSlice.reducer;
export const selectBoard = boardMenuSlice.actions.selectBoard;
export const initBoardMenu = boardMenuSlice.actions.initBoardMenu;
