import { createSlice } from "@reduxjs/toolkit";
import UserInfo from "../../jsons/UserInfo.json";

const initialState = {
  userName: UserInfo.name,
  userId: UserInfo.id,
  userRole: UserInfo.role,
  userGroup: UserInfo.group,
};

const userStateSlice = createSlice({
  name: "userState",
  initialState: initialState,
  reducers: {},
});

export const userStateReducer = userStateSlice.reducer;
