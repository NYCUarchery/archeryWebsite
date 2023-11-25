import { createSlice } from "@reduxjs/toolkit";
import UserInfo from "../../../../jsons/UserInfo.json";

const initialState = {
  boardId: 0,
  boardShown: "score",
};

let avaliableBoards: string[] = ["score"];

switch (UserInfo.role) {
  case "admin":
    avaliableBoards.push("administration");
    break;
  case "player":
    avaliableBoards.push("recording");
    break;
}

const boardSwitchSlice = createSlice({
  name: "boardSwitch",
  initialState: initialState,
  reducers: {
    switchBoard: (state) => {
      if (state.boardId < avaliableBoards.length - 1) {
        state.boardId++;
      } else {
        state.boardId = 0;
      }

      state.boardShown = avaliableBoards[state.boardId];
    },
  },
});

export const boardSwitchReducer = boardSwitchSlice.reducer;
export const switchBoard = boardSwitchSlice.actions.switchBoard;
