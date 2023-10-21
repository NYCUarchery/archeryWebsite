import { configureStore, createAction, createReducer } from '@reduxjs/toolkit'

const setUid = createAction<number>('setUid');
const resetUid = createAction('resetUid');

const setName = createAction<string>('setName')
const resetName = createAction('resetName')

const setOverview = createAction<string>('setOverview')
const resetOverview = createAction('resetOverview')

const setEmail = createAction<string>('setEmail')
const resetEmail = createAction('resetEmail')

const setInstitutionID = createAction<string>('setInstitutionID')
const resetInstitutionID = createAction('resetInstitutionID')

const setDirty = createAction('setDirty')
const resetDirty = createAction('resetDirty')

const resetAllInfo = createAction('resetAllInfo')


const userReducer = createReducer(
	{
		uid: -1,
		userInfo: {
			name: "",
			overview: "",
			email: "",
			institutionID: "",
		},
		dirty: 1,
	},
	(builder) => {
		builder
		.addCase(setUid, (state, action) => {
			state.uid = action.payload;
		})
		.addCase(resetUid, (state, action) => {
			state.uid = -1;
		})
		.addCase(setName, (state, action) => {
			state.userInfo.name = action.payload;
		})
		.addCase(resetName, (state, action) => {
			state.userInfo.name = "";
		})
		.addCase(setOverview, (state, action) => {
			state.userInfo.overview = action.payload;
		})
		.addCase(resetOverview, (state, action) => {
			state.userInfo.overview = "";
		})
		.addCase(setEmail, (state, action) => {
			state.userInfo.email = action.payload;
		})
		.addCase(resetEmail, (state, action) => {
			state.userInfo.email = "";
		})
		.addCase(setInstitutionID, (state, action) => {
			state.userInfo.institutionID = action.payload;
		})
		.addCase(resetInstitutionID, (state, action) => {
			state.userInfo.institutionID = "";
		})
		.addCase(setDirty, (state, action) => {
			state.dirty = 1;
		})
		.addCase(resetDirty, (state, action) => {
			state.dirty = 0;
		})
		.addCase(resetAllInfo, (state, action) => {
			state.uid = -1;
			state.userInfo.name = "";
			state.userInfo.overview = "";
			state.userInfo.email = "";
			state.userInfo.institutionID = "";
		})
		.addDefaultCase((state, action) => {});
	}
);

const userStore = configureStore({reducer: userReducer});

export { 
	userReducer, userStore,
	setUid, resetUid,
	setName, resetName,
	setOverview, resetOverview,
	setEmail, resetEmail,
	setInstitutionID, resetInstitutionID,
	setDirty, resetDirty,
	resetAllInfo,
};