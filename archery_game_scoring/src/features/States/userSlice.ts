import { createSlice } from "@reduxjs/toolkit";
import UserInfo from "../../jsons/UserInfo.json";

const initialState = {
  userName: UserInfo.name,
  userId: UserInfo.id,
  userRole: UserInfo.role,
  userGroup: UserInfo.group,
  userLane: UserInfo.lane,
  userTarget: UserInfo.target,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {},
});

export const userReducer = userSlice.reducer;
