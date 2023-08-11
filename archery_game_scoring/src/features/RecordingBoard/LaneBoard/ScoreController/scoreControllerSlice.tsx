import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPlayer: 0,
  scoreNum: 0,
  allScores: [[0], [0], [0], [0]],
  totals: [0, 0, 0, 0],
  confirmations: [false, false, false, false],
};

const scoreControllerSlice = createSlice({
  name: "scoreController",
  initialState,
  reducers: {
    initScoreController: (state, action) => {
      state.scoreNum = action.payload.scoreNum;
      state.allScores = action.payload.allScores;
      state.totals = action.payload.totals;
      state.confirmations = action.payload.confirmations;
    },
    selectPlayer: (state, action) => {
      state.selectedPlayer = action.payload;
    },

    addScore: (state, action) => {
      if (state.allScores[state.selectedPlayer].length < state.scoreNum) {
        state.allScores[state.selectedPlayer].push(action.payload.score);
      }
    },
    deleteScore: (state) => {
      if (state.allScores[state.selectedPlayer].length > 0) {
        state.allScores[state.selectedPlayer].pop();
      }
    },
    toggleConfirmation: (state, action) => {
      state.confirmations[action.payload] =
        !state.confirmations[action.payload];
    },
  },
});

export const scoreControllerReducer = scoreControllerSlice.reducer;
export const initScoreController =
  scoreControllerSlice.actions.initScoreController;
export const selectPlayer = scoreControllerSlice.actions.selectPlayer;
export const addScore = scoreControllerSlice.actions.addScore;
export const deleteScore = scoreControllerSlice.actions.deleteScore;
export const toggleConfirmation =
  scoreControllerSlice.actions.toggleConfirmation;
