import { createSlice } from "@reduxjs/toolkit";
import { User } from "../../QueryHooks/types/User";

const initialState = {
  userName: "",
  userId: 0,
  userRealName: "訪客",
  institutionId: 0,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    initUser: (state, action) => {
      const user = action.payload as User;
      state.userName = user.user_name;
      state.userId = user.id;
      state.userRealName = user.real_name;
      state.institutionId = user.institution_id;
    },
  },
});

export const userReducer = userSlice.reducer;
export const initUser = userSlice.actions.initUser;
