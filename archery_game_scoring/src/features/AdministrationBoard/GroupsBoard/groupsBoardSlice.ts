import { createSlice } from "@reduxjs/toolkit";
import GroupInfo from "../../../jsons/GroupInfo.json";

const initialState = {
  groupsNum: GroupInfo.group_num,
  groupNames: GroupInfo.group_names,
  groups: create2DArray(GroupInfo.group_num),
};

const groupsBoardSlice = createSlice({
  name: "groupsBoard",
  initialState: initialState,
  reducers: {
    addGroup: (state) => {
      state.groupsNum++;
      state.groups.push([]);
    },
    removeGroup: (state) => {
      state.groupsNum--;
      state.groups.pop();
    },
    setGroups: (state, action) => {
      let groups = create2DArray(state.groupsNum);
      let players = action.payload;
      for (let i = 0; i < players.length; i++) {
        groups[players[i].group].push(players[i]);
      }
      state.groups = groups;
    },
  },
});

function create2DArray(row: number): Array<Array<any>> {
  let arr = [];
  for (let i = 0; i < row; i++) {
    arr.push([]);
  }
  return arr;
}

export const groupsBoardReducer = groupsBoardSlice.reducer;
export const addGroup = groupsBoardSlice.actions.addGroup;
export const removeGroup = groupsBoardSlice.actions.removeGroup;
export const setGroups = groupsBoardSlice.actions.setGroups;
