import { configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";
import { groupListButtonReducer } from "../features/Screen/SubGameBar/GroupList/groupListButtonSlice";
import { phaseListButtonReducer } from "../features/Screen/SubGameBar/PhaseList/phaseListButtonSlice";
import { stageControllerReducer } from "../features/Screen/BottomBar/StageController/stageControllerSlice";
import { boardSwitchReducer } from "../features/Screen/TopBar/BoardSwitch/boardSwitchSlice";

const store = configureStore({
  reducer: {
    groupListButton: groupListButtonReducer,
    phaseListButton: phaseListButtonReducer,
    stageController: stageControllerReducer,
    boardSwitch: boardSwitchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ReduxLogger),
});

export default store;
