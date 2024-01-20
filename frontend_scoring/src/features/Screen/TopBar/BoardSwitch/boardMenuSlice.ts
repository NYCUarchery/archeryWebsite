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
    initBoardSwitch: (state, action) => {
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
export const switchBoard = boardMenuSlice.actions.selectBoard;
export const initBoardSwitch = boardMenuSlice.actions.initBoardSwitch;
