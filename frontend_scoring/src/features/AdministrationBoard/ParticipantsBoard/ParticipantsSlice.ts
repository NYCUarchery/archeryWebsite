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
      const application = state.playerApplications[action.payload as number];
      const player = {
        id: application.id,
        name: application.name,
        group: application.group,
        lane: 0,
      };
      state.players.push(player);
      state.playerApplications.splice(action.payload as number, 1);
      state.players.sort((a, b) => {
        return a.id - b.id;
      });
    },
    confirmAdmin: (state, action) => {
      state.admins.push(state.adminApplications[action.payload as number]);
      state.adminApplications.splice(action.payload as number, 1);
      state.admins.sort((a, b) => {
        return a.id - b.id;
      });
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
