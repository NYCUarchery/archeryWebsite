import { configureStore, createAction, createReducer } from '@reduxjs/toolkit'

const setUid = createAction<number>('setUid')
const resetUid = createAction('resetUid')

const userReducer = createReducer(
	{
		uid: -1,
	},
	(builder) => {
		builder
		.addCase(setUid, (state, action) => {
			state.uid = action.payload;
		})
		.addCase(resetUid, (state, action) => {
			state.uid = -1;
		})
		.addDefaultCase((state, action) => {});
	}
)

const userStore = configureStore({reducer: userReducer});

export { userReducer, setUid, resetUid, userStore };