import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  boardId: 0,
  boardShown: "score",
  avaliableBoards: ["score"],
};

const boardSwitchSlice = createSlice({
  name: "boardSwitch",
  initialState: initialState,
  reducers: {
    switchBoard: (state) => {
      if (state.boardId < state.avaliableBoards.length - 1) {
        state.boardId++;
      } else {
        state.boardId = 0;
      }

      state.boardShown = state.avaliableBoards[state.boardId];
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

export const boardSwitchReducer = boardSwitchSlice.reducer;
export const switchBoard = boardSwitchSlice.actions.switchBoard;
export const initBoardSwitch = boardSwitchSlice.actions.initBoardSwitch;
