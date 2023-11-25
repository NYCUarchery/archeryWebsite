import { createSlice } from "@reduxjs/toolkit";
import UserInfo from "../../jsons/UserInfo.json";

const initialState = {
  userName: UserInfo.name,
  userStatus: "pending",
  userId: UserInfo.id,
  userRole: UserInfo.role,
  userGroup: UserInfo.group,
  userLane: UserInfo.lane,
  userTarget: UserInfo.target,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    initUserName: (state, action) => {
      state.userName = action.payload;
    },
    initUserId: (state, action) => {
      state.userId = action.payload;
    },
    initUserRole: (state, action) => {
      state.userRole = action.payload;
    },
    initUserStatus: (state, action) => {
      state.userStatus = action.payload;
    },
  },
});

export const userReducer = userSlice.reducer;
export const initUserName = userSlice.actions.initUserName;
export const initUserId = userSlice.actions.initUserId;
export const initUserRole = userSlice.actions.initUserRole;
export const initUserStatus = userSlice.actions.initUserStatus;
