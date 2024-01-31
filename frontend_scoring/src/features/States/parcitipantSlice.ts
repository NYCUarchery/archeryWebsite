import { createSlice } from "@reduxjs/toolkit";
import { Participant } from "../../QueryHooks/types/Participant";

const initialState = {
  participantStatus: "pending",
  participantId: 0,
  participantRole: "viewer",
};

const participantSlice = createSlice({
  name: "participant",
  initialState: initialState,
  reducers: {
    initParticipant: (state, action) => {
      const participant = action.payload as Participant;
      state.participantStatus = participant.status;
      state.participantId = participant.id;
      state.participantRole = participant.role;
    },
  },
});

export const participantReducer = participantSlice.reducer;
export const initParticipant = participantSlice.actions.initParticipant;
