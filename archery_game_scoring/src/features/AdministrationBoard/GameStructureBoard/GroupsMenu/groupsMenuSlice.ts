import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  groupShown: 1,
};

const groupMenuSlice = createSlice({
  name: "gameStructureGroupMenu",
  initialState: initialState,
  reducers: {
    setGroupShown: (state, action) => {
      state.groupShown = action.payload;
      state.isOpen = false;
    },
    toggleMenu: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeMenu: (state) => {
      state.isOpen = false;
    },
  },
});

export const gameStructureGroupMenuReducer = groupMenuSlice.reducer;
export const setGroupShown = groupMenuSlice.actions.setGroupShown;
export const toggleMenu = groupMenuSlice.actions.toggleMenu;
export const closeMenu = groupMenuSlice.actions.closeMenu;
