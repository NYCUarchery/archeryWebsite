import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    phaseShown: "資格賽",
    phaseListHidden: "hidden"

}

const phaseListButtonSlice = createSlice({
    name: "phaseListButton",
    initialState,
    reducers:{
        togglePhaseList:(state) =>{
               ((state.phaseListHidden === "") ? state.phaseListHidden = "hidden" : state.phaseListHidden = "")
        },
        selectPhase:(state, action) =>{
            state.phaseShown = action.payload;

        }
    },
})

export const phaseListButtonReducer = phaseListButtonSlice.reducer;
export const togglePhaseList  = phaseListButtonSlice.actions.togglePhaseList;
export const selectPhase  = phaseListButtonSlice.actions.selectPhase;
