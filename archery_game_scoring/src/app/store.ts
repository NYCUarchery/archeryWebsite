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
import { adminBoardListReducer } from "../features/Screen/SubGameBar/AdminList/adminBoardListSlice";
import { groupsBoardReducer } from "../features/AdministrationBoard/GroupsBoard/groupsBoardSlice";
import { groupSelectorReducer } from "../features/AdministrationBoard/GroupsBoard/GroupSelector/groupSelectorSlice";
import { gameStructureBoardReducer } from "../features/AdministrationBoard/GameStructureBoard/gameStructureBoardSlice";

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
    adminBoardList: adminBoardListReducer,
    groupsBoard: groupsBoardReducer,
    groupSelector: groupSelectorReducer,
    gameStructureBoard: gameStructureBoardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ReduxLogger),
});

export default store;
