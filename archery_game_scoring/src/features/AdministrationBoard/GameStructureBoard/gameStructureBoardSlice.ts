import { createSlice } from "@reduxjs/toolkit";
import GameInfo from "../../../jsons/GameInfo.json";

const initalState = {
  subboardShown: 0,
  subboardNames: ["啟用", "資格賽", "對抗賽", "團體對抗賽", "混雙對抗賽"],
  qualiciationInfo: GameInfo.qualification,
};

const gameStructureBoardSlice = createSlice({
  name: "gameStructureBoard",
  initialState: initalState,
  reducers: {
    setSubboardShown: (state, action) => {
      state.subboardShown = action.payload;
    },
  },
});

export const gameStructureBoardReducer = gameStructureBoardSlice.reducer;
export const setSubboardShown =
  gameStructureBoardSlice.actions.setSubboardShown;
