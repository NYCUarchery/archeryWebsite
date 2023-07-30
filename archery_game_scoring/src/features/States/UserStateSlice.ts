import { createSlice } from "@reduxjs/toolkit";
import UserInfo from "../../jsons/UserInfo.json";

const initialState = {
  userName: UserInfo.name,
  userId: UserInfo.id,
  userRole: UserInfo.role,
  userGroup: UserInfo.group,
};

const UserStateSlice = createSlice({
  name: "UserState",
  initialState: initialState,
  reducers: {},
});

export const UserStateReducer = UserStateSlice.reducer;
