import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stageShown: 0,
  stageNum: 0,
  stageControllerIsHidden: true,
  stageListIsHidden: true,
};

const stageControllerSlice = createSlice({
  name: "stageController",
  initialState,
  reducers: {
    toggleStageController: (state) => {
      state.stageControllerIsHidden === true
        ? (state.stageControllerIsHidden = false)
        : (state.stageControllerIsHidden = true);
    },

    toggleStageList: (state) => {
      state.stageListIsHidden === true
        ? (state.stageListIsHidden = false)
        : (state.stageListIsHidden = true);
    },

    selectStage: (state, action) => {
      state.stageShown = action.payload;
      state.stageControllerIsHidden = true;
    },
    nextStage: (state) => {
      if (state.stageShown <= state.stageNum) state.stageShown++;
    },
    lastStage: (state) => {
      if (state.stageShown > 0) state.stageShown--;
    },
    setStageNum: (state, action) => {
      state.stageNum = action.payload;
    },
  },
});

export const stageControllerReducer = stageControllerSlice.reducer;
export const toggleStageController =
  stageControllerSlice.actions.toggleStageController;
export const toggleStageList = stageControllerSlice.actions.toggleStageList;
export const selectStage = stageControllerSlice.actions.selectStage;
export const nextStage = stageControllerSlice.actions.nextStage;
export const lastStage = stageControllerSlice.actions.lastStage;
export const setStageNum = stageControllerSlice.actions.setStageNum;
