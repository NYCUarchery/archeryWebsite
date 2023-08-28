import { configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";
import { groupListButtonReducer } from "../features/Screen/SubGameBar/GroupList/groupListButtonSlice";
import { phaseListButtonReducer } from "../features/Screen/SubGameBar/PhaseList/phaseListButtonSlice";
import { stageControllerReducer } from "../features/Screen/BottomBar/StageController/stageControllerSlice";
import { boardSwitchReducer } from "../features/Screen/TopBar/BoardSwitch/boardSwitchSlice";
import { scoreControllerReducer } from "../features/RecordingBoard/LaneBoard/ScoreController/scoreControllerSlice";
import { gameReducer } from "../features/States/gameSlice";
import { userReducer } from "../features/States/userSlice";
import { participantsReducer } from "../features/AdministrationBoard/ParticipantsBoard/ParticipantsSlice";

const store = configureStore({
  reducer: {
    groupListButton: groupListButtonReducer,
    phaseListButton: phaseListButtonReducer,
    stageController: stageControllerReducer,
    boardSwitch: boardSwitchReducer,
    scoreController: scoreControllerReducer,
    game: gameReducer,
    user: userReducer,
    participants: participantsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ReduxLogger),
});

export default store;
