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
    initialize: (state, action) => {
      state.players = [];
      state.playerApplications = [];
      state.admins = [];
      state.adminApplications = [];
      for (let i = 0; i < action.payload.length; i++) {
        const participant = action.payload[i];
        if (participant.role === "player") {
          if (participant.status === "pending") {
            state.playerApplications.push(participant);
            continue;
          }
          state.players.push(participant);
        } else if (participant.role === "admin") {
          if (participant.status === "pending") {
            state.adminApplications.push(participant);
            continue;
          }
          state.admins.push(participant);
        }
      }
    },

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
export const initialize = participantsSlice.actions.initialize;
