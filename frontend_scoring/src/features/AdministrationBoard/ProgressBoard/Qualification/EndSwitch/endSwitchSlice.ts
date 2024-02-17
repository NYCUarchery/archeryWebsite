import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  endShown: 0,
};

const endSwitchSlice = createSlice({
  name: "endSwitch",
  initialState: initialState,
  reducers: {
    setEndShown: (state, action) => {
      state.endShown = action.payload;
    },
    increaseEndShown: (state) => {
      state.endShown += 1;
    },
    decreaseEndShown: (state) => {
      state.endShown -= 1;
    },
  },
});

export const processEndSwitchReducer = endSwitchSlice.reducer;
export const setEndShown = endSwitchSlice.actions.setEndShown;
