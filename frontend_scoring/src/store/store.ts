import { Middleware, configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";

const store = configureStore({
  reducer: {},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ReduxLogger as Middleware),
});

export default store;
