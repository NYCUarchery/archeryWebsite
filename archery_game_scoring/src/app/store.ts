import { configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";
import { groupListButtonReducer } from "../features/Screen/SubGameBar/GroupList/groupListButtonSlice";
import { phaseListButtonReducer } from "../features/Screen/SubGameBar/PhaseList/phaseListButtonSlice";
import { stageControllerReducer } from "../features/Screen/BottomBar/StageController/stageControllerSlice";
import { boardSwitchReducer } from "../features/Screen/TopBar/BoardSwitch/boardSwitchSlice";
import { gameReducer } from "../features/States/gameSlice";
import { userReducer } from "../features/States/userSlice";

const store = configureStore({
  reducer: {
    groupListButton: groupListButtonReducer,
    phaseListButton: phaseListButtonReducer,
    stageController: stageControllerReducer,
    boardSwitch: boardSwitchReducer,
    game: gameReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ReduxLogger),
});

export default store;
