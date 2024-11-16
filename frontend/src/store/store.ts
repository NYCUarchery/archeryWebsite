import { Middleware, configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";
import qualificationScheduleSlice from "app/competition/[id]/admin/schedule/qualification/qualificationScheduleSlice";
import qualificationScoringSlice from "app/competition/[id]/scoring/@qualification/qualificationScoringSlice";
import scheduleSlice from "app/competition/[id]/admin/schedule/scheduleSlice";
import progressSlice from "app/competition/[id]/admin/progress/progressSlice";

const store = configureStore({
  reducer: {
    qualificationSchedule: qualificationScheduleSlice,
    qualificationScoring: qualificationScoringSlice,
    schedule: scheduleSlice,
    progress: progressSlice,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware().concat(ReduxLogger as Middleware),
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
