import { configureStore } from "@reduxjs/toolkit";
import ReduxLogger from "redux-logger";
import { groupListButtonReducer } from "../features/Screen/SubGameBar/GroupList/groupListButtonSlice";
import { phaseListButtonReducer } from "../features/Screen/SubGameBar/PhaseList/phaseListButtonSlice";
import { stageControllerReducer } from "../features/Screen/BottomBar/StageController/stageControllerSlice";
import { boardMenuReducer } from "../features/Screen/TopBar/BoardMenu/boardMenuSlice";
import { scoreControllerReducer } from "../features/RecordingBoard/LaneBoard/ScoreController/scoreControllerSlice";
import { gameReducer } from "../features/States/gameSlice";
import { userReducer } from "../features/States/userSlice";
import { adminBoardTabsReducer } from "../features/Screen/SubGameBar/AdminBoardTabs/adminBoardTabsSlice";
import { groupsBoardReducer } from "../features/AdministrationBoard/GroupsBoard/groupsBoardSlice";
import { groupSelectorReducer } from "../features/AdministrationBoard/GroupsBoard/GroupSelector/groupSelectorSlice";
import { gameStructureBoardReducer } from "../features/AdministrationBoard/GameStructureBoard/gameStructureBoardSlice";
import { gameStructureGroupMenuReducer } from "../features/AdministrationBoard/GameStructureBoard/GroupsMenu/groupsMenuSlice";
import { qualificationStructureGroupBoardReducer } from "../features/AdministrationBoard/GameStructureBoard/QualificationBoard/GroupBoard/groupBoardSlice";
import { adminPhaseSelectorReducer } from "../features/AdministrationBoard/PhaseSelector/phaseSelectorSlice";
import { qualificationStructureSetterReducer } from "../features/AdministrationBoard/GameStructureBoard/QualificationBoard/QualificationStructureSetter/qualificationStructureSetterSlice";

const store = configureStore({
  reducer: {
    groupListButton: groupListButtonReducer,
    phaseListButton: phaseListButtonReducer,
    stageController: stageControllerReducer,
    boardMenu: boardMenuReducer,
    scoreController: scoreControllerReducer,
    game: gameReducer,
    user: userReducer,
    adminBoardTabs: adminBoardTabsReducer,

    groupsBoard: groupsBoardReducer,
    groupSelector: groupSelectorReducer,

    gameStructureBoard: gameStructureBoardReducer,
    gameStructureGroupMenu: gameStructureGroupMenuReducer,
    qualificationStructureGroupBoard: qualificationStructureGroupBoardReducer,
    adminPhaseSelector: adminPhaseSelectorReducer,
    qualificationStructureSetter: qualificationStructureSetterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ReduxLogger),
});

export default store;
