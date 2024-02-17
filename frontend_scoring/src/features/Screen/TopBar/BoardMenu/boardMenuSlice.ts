import { createSlice } from "@reduxjs/toolkit";
import { Participant } from "../../../../QueryHooks/types/Participant";

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
      const participant = action.payload as Participant;
      if (participant.role === "admin" && participant.status === "approved") {
        state.avaliableBoards = ["score", "administration"];
      } else if (
        participant.role === "player" &&
        participant.status === "approved"
      ) {
        state.avaliableBoards = ["score", "recording"];
      }
    },
  },
});

export const boardMenuReducer = boardMenuSlice.reducer;
export const selectBoard = boardMenuSlice.actions.selectBoard;
export const initBoardMenu = boardMenuSlice.actions.initBoardMenu;
