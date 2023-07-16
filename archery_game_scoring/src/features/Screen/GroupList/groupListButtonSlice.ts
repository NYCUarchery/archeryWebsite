import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    groupShown: "新生",
    groupListHidden: "hidden"

}

const groupListButtonSlice = createSlice({
    name: "groupListButton",
    initialState,
    reducers:{
        toggleGroupList:(state) =>{
               ((state.groupListHidden === "") ? state.groupListHidden = "hidden" : state.groupListHidden = "")
        },
        selectGroup:(state, action) =>{
            state.groupShown = action.payload;
        },
    },
})

export const groupListButtonReducer = groupListButtonSlice.reducer;
export const toggleGroupList  = groupListButtonSlice.actions.toggleGroupList;
export const selectGroup  = groupListButtonSlice.actions.selectGroup;