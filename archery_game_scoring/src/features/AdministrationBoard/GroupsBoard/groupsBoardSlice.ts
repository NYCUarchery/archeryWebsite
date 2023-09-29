import { createSlice } from "@reduxjs/toolkit";
import GroupInfo from "../../../jsons/GroupInfo.json";

const initialState = {
  groupsNum: GroupInfo.groups_num,
  groupNames: GroupInfo.group_names,
  groups: create2DArray(GroupInfo.groups_num),
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
    movePlayer: (state, action) => {
      let playerIndex = action.payload.index;
      let fromGroupId = action.payload.groupId;
      let toGroupId = action.payload.selectedGroupId;
      if (toGroupId === fromGroupId || toGroupId === null) {
        return;
      }
      let player = state.groups[fromGroupId][playerIndex];
      state.groups[fromGroupId].splice(playerIndex, 1);
      state.groups[toGroupId].push(player);
      state.groups[toGroupId].sort((a, b) => {
        return a.id - b.id;
      });
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
export const movePlayer = groupsBoardSlice.actions.movePlayer;
