import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { DatabaseRoundEnd } from "@/types/Api";

const initialState = {
  selectedOrder: 0,
  ends: [] as DatabaseRoundEnd[],
};

export const qualificationScoringSlice = createSlice({
  name: "QualificationScoring",
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<number>) => {
      state.selectedOrder = action.payload;
    },
    initEnds: (state, action: PayloadAction<DatabaseRoundEnd[]>) => {
      state.ends = action.payload;
    },
    addScore: (state, action: PayloadAction<number>) => {
      const roundScores = state.ends[state.selectedOrder - 1].round_scores;
      const lastEmptyScore = roundScores?.find((score) => score.score === -1);

      if (lastEmptyScore !== undefined) {
        lastEmptyScore.score = action.payload;
      }
    },
    deleteScore: (state) => {
      const roundScores = state.ends[state.selectedOrder - 1].round_scores;
      const lastEmptyScoreIndex = roundScores?.findIndex(
        (score) => score.score === -1
      );

      if (lastEmptyScoreIndex !== 0) {
        roundScores![
          lastEmptyScoreIndex === -1 ? 5 : lastEmptyScoreIndex! - 1
        ].score = -1;
      }
    },
    confirm(state, action: PayloadAction<number>) {
      const index = action.payload ? action.payload : state.selectedOrder - 1;
      state.ends[index].is_confirmed = true;
    },
  },
});

export const { setSelectedOrder, initEnds, addScore, deleteScore, confirm } =
  qualificationScoringSlice.actions;
export default qualificationScoringSlice.reducer;
