import { createSlice } from "@reduxjs/toolkit";
import GameInfo from "../../../jsons/GameInfo.json";

interface PlayerLaneLoad {
  groupId: number;
  playerId: number;
  lane: number;
}

interface PlayerOrderLoad {
  groupId: number;
  playerId: number;
  laneId: number;
  order: number;
}

const initalState = {
  subboardShown: 0,
  subboardNames: ["啟用", "資格賽", "對抗賽", "團體對抗賽", "混雙對抗賽"],
  qualificationInfo: GameInfo.qualification,
};

const gameStructureBoardSlice = createSlice({
  name: "gameStructureBoard",
  initialState: initalState,
  reducers: {
    setSubboardShown: (state, action) => {
      state.subboardShown = action.payload;
    },
    setPlayerLane: (_state, action) => {
      const load: PlayerLaneLoad = action.payload as PlayerLaneLoad;
      console.log("Set player" + load.playerId + "to lane " + load.lane);
    },
    setPlayerOrder: (_state, action) => {
      const load: PlayerOrderLoad = action.payload as PlayerOrderLoad;
      console.log("Set player" + load.playerId + "to order " + load.order);
    },
  },
});

export const gameStructureBoardReducer = gameStructureBoardSlice.reducer;
export const setSubboardShown =
  gameStructureBoardSlice.actions.setSubboardShown;
