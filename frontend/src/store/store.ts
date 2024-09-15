import { Middleware, configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";
import qualificationScheduleSlice from "app/competition/[id]/admin/schedule/qualification/qualificationScheduleSlice";
import scheduleSlice from "app/competition/[id]/admin/schedule/scheduleSlice";

const store = configureStore({
  reducer: {
    qualificationSchedule: qualificationScheduleSlice,
    schedule: scheduleSlice,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware().concat(ReduxLogger as Middleware),
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
