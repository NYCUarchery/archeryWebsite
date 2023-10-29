import { createSlice } from "@reduxjs/toolkit";
import ParticipantsInfo from "../../../jsons/ParticipantsInfo.json";

const initialState = {
  players: ParticipantsInfo.players,
  playerApplications: ParticipantsInfo.player_applications,
  admins: ParticipantsInfo.admins,
  adminApplications: ParticipantsInfo.admin_applications,
};

const participantsSlice = createSlice({
  name: "participants",
  initialState: initialState,
  reducers: {
    deletePlayerApplication: (state, action) => {
      state.playerApplications.splice(action.payload, 1);
    },
    deleteAdminsApplication: (state, action) => {
      state.adminApplications.splice(action.payload as number, 1);
    },

    confirmPlayer: (state, action) => {
      state.players.push(state.playerApplications[action.payload as number]);
      state.playerApplications.splice(action.payload as number, 1);
    },
    confirmAdmin: (state, action) => {
      state.admins.push(state.adminApplications[action.payload as number]);
      state.adminApplications.splice(action.payload as number, 1);
    },

    deletePlayer: (state, action) => {
      state.players.splice(action.payload as number, 1);
    },
    deleteAdmin: (state, action) => {
      state.admins.splice(action.payload as number, 1);
    },
  },
});

export const participantsReducer = participantsSlice.reducer;
export const deletePlayerApplication =
  participantsSlice.actions.deletePlayerApplication;
export const deleteAdminsApplication =
  participantsSlice.actions.deleteAdminsApplication;
export const confirmPlayer = participantsSlice.actions.confirmPlayer;
export const confirmAdmin = participantsSlice.actions.confirmAdmin;
export const deletePlayer = participantsSlice.actions.deletePlayer;
export const deleteAdmin = participantsSlice.actions.deleteAdmin;
