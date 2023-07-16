import { configureStore } from "@reduxjs/toolkit";
import ReduxLogger  from "redux-logger";
import {groupListButtonReducer } from "../features/Screen/GroupList/groupListButtonSlice"
import {phaseListButtonReducer} from "../features/Screen/PhaseList/phaseListButtonSlice";


const store = configureStore({
    reducer: {
        groupListButton: groupListButtonReducer,
        phaseListButton: phaseListButtonReducer,

    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(ReduxLogger),
})


export default store;