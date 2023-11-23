import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  boardId: 0,
  boardShown: "administration",
  avaliableBoards: ["score"],
};

const boardSwitchSlice = createSlice({
  name: "boardSwitch",
  initialState: initialState,
  reducers: {
    initializeBoard: (state, action) => {
      const role = action.payload;
      state.avaliableBoards = ["score"];

      switch (role) {
        case "admin":
          state.avaliableBoards.push("administration");
          break;
        case "player":
          state.avaliableBoards.push("recording");
          break;
      }
    },
    switchBoard: (state) => {
      if (state.boardId < state.avaliableBoards.length - 1) {
        state.boardId++;
      } else {
        state.boardId = 0;
      }

      state.boardShown = state.avaliableBoards[state.boardId];
    },
  },
});

export const boardSwitchReducer = boardSwitchSlice.reducer;
export const switchBoard = boardSwitchSlice.actions.switchBoard;

export const initializeBoard = boardSwitchSlice.actions.initializeBoard;
