import { createSlice } from "@reduxjs/toolkit";
import GroupInfo from "../../jsons/GroupInfo.json";
import GameInfo from "../../jsons/GameInfo.json";
import PhaseInfo from "../../jsons/PhaseInfo.json";

const initialState = {
  hostId: GameInfo.host_id,
  currentPhase: GameInfo.current_phase,
  currentPhaseKind: GameInfo.current_phase_kind,
  currentStage: GameInfo.current_stage,
  phases: PhaseInfo.phases,
  groupsNum: GroupInfo.groups_num,
  groupNames: GroupInfo.group_names,
  lanesNum: GameInfo.lanes_num,

  qualificationIsActive: GameInfo.qualification_is_active,
  qualification: GameInfo.qualification,
  eliminationIsActive: GameInfo.elimination_is_active,
  teamEliminationIsActive: GameInfo.team_elimination_is_active,
  mixedEliminationIsActive: GameInfo.mixed_elimination_is_active,
};

const gameSlice = createSlice({
  name: "game",
  initialState: initialState,
  reducers: {
    progressPhase: (state) => {
      state.currentPhase++;
    },
    regressPhase: (state) => {
      state.currentPhase--;
    },
    progressStage: (state) => {
      state.currentStage++;
    },
    regressStage: (state) => {
      state.currentStage--;
    },
    activatePhase: (state, action) => {
      switch (action.payload as string) {
        case "Qualification":
          state.qualificationIsActive = true;
          break;
        case "Elimination":
          state.eliminationIsActive = true;
          break;
        case "Team Elimination":
          state.teamEliminationIsActive = true;
          break;
        case "Mixed Elimination":
          state.mixedEliminationIsActive = true;
          break;
      }
    },
    setQualificationEndsNum: (state, action) => {
      state.qualification.ends_num = action.payload;
    },
    setQualificationRoundsNum: (state, action) => {
      state.qualification.rounds_num = action.payload;
    },
    setQualificationArrowsNumPerEnd: (state, action) => {
      state.qualification.arrows_num_per_end = action.payload;
    },
    setQualificationLanes: (state, action) => {
      state.qualification.groups[action.payload.groupId].end_lane =
        action.payload.endLane;
      state.qualification.groups[action.payload.groupId].start_lane =
        action.payload.startLane;
    },
  },
});

export const gameReducer = gameSlice.reducer;
export const progressPhase = gameSlice.actions.progressPhase;
export const regressPhase = gameSlice.actions.regressPhase;
export const progressStage = gameSlice.actions.progressStage;
export const regressStage = gameSlice.actions.regressStage;
export const activatePhase = gameSlice.actions.activatePhase;
export const setQualificationEndsNum =
  gameSlice.actions.setQualificationEndsNum;
export const setQualificationRoundsNum =
  gameSlice.actions.setQualificationRoundsNum;
export const setQualificationArrowsNumPerEnd =
  gameSlice.actions.setQualificationArrowsNumPerEnd;
export const setQualificationLanes = gameSlice.actions.setQualificationLanes;
