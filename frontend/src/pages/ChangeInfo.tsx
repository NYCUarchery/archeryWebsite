
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { redirect, useNavigate } from 'react-router-dom';
import avatar from "../assets/images/avatar.jpg";
import FormControl from '@mui/material/FormControl';

import TextField from '@mui/material/TextField';
import { Formik } from 'formik';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from '../util/api';
import routing from '../util/routing';
import { useState } from 'react';

const ChangeInfo = () => {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
	const [showOriPassword, setShowOriPassword] = useState(false);
	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleClickShowPasswordConfirm = () => {
		setShowPasswordConfirm(!showPasswordConfirm);
	};

	const handleClickShowOriPassword = () => {
		setShowOriPassword(!showOriPassword);
	};

	const handleMouseDownPassword = (e: any) => {
		e.preventDefault();
	};

	const handleMouseDownPasswordConfirm = (e: any) => {
		e.preventDefault();
	};

	const handleMouseDownOriPassword = (e: any) => {
		e.preventDefault();
	};
	return (
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Formik
					initialValues={{
						nickname: "Godtone",
						overview: "你以為你躲起來就找不到你了嗎，沒有用的。你是那樣拉風的男人，不管在什麼地方，就好像漆黑中的螢火蟲一樣，是那樣的鮮明，那樣的出眾。你那憂鬱的眼神，唏噓的鬍渣子，隨意叼著的牙籤，還有那杯 dry martine ，都深深的迷住了我。張嘉航,你真是電競界的罪人,你害怕你強大的天賦會蓋過其他人,選擇在接觸遊戲十年後再出道,而放棄與你的宿敵 FAKER 競爭神的寶座,今年該是你奪回神寶座的時候了。",
						oriPassword: "",
						password: "",
						passwordConfirm: "",
						organization: "",
					}}
					onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
						const body = new FormData();
						
						// body.append("nickname", values.nickname);
						body.append("overview", values.overview);
						body.append("oriPassword", values.oriPassword);
						body.append("organization", values.organization);
						console.log("body: ", body);
						var id;
						await fetch(`http://localhost:8080/${api.user.getUserID}`, {
							method: "GET",
							credentials: "include",
						})
						.then((res) => res.json())
						.then((resjson) => {
							if (resjson["uid"]) {
								id = resjson["uid"];
							}
						});
						await fetch(`http://localhost:8080/${api.user.info}/${id}`, {
							method: "GET",
							credentials: "include",
						})
						.then((res) => res.json())
						.then((resjson) => {
							if (resjson["result"] && resjson["result"] == "success") {
								body.append("username", resjson["name"]);
							}
						});
						await fetch(`http://localhost:8080/${api.user.modifyInfo}`, {
							method: "PUT",
							credentials: "include",
							body,
						})
						.then((res) => {
							return res.json();
						})
						.then((resjson) => {
							console.log(resjson);
							if (resjson["result"] && resjson["result"] === "success") {
								console.log("Change Success");
								navigate(routing.Personal)
							} else {
								console.log("Too bad QQ");
							}
						});
					}}
				>
					{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
						<form noValidate onSubmit={handleSubmit}>
							<Grid container flexDirection="row-reverse" alignItems="stretch" justifyContent="center" spacing={2}>
								<Grid item xs={4} sx={{minWidth: "160px"}}>
									<img src={avatar} alt="My Avatar" width="160px" />
								</Grid>
								<Grid item xs={8} container direction="row" alignItems="stretch" justifyContent="center">
									<Grid item xs={12}>
										<FormControl>
											<Typography variant="h6" component={() => (
												<TextField
													label="暱稱"
													value={values.nickname}
													name="nickname"
													onChange={handleChange}
													onBlur={handleBlur}
												/>
											)}/>
										</FormControl>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<FormControl>
											<Typography variant="body2" 
												component={() => (
													<TextField
														label="自我介紹"
														value={values.overview}
														name="overview"
														onChange={handleChange}
														onBlur={handleBlur}
														multiline
														sx={{ 
															maxHeight: "200px", overflowY: "scroll", pt: "5px",
															'&::-webkit-scrollbar': {
																width: '1px'
															}, 
															"& label": {
																mt: 0.8
															},
															'userSelect': 'none',
															width: { sm: "500px", xs: "200px"},
														}}
													/>
												)}
											/>
										</FormControl>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<FormControl sx={{width: "300px"}}>
											<TextField
												type={showOriPassword ? 'text' : 'password'}
												label="請輸入原本密碼"
												value={values.oriPassword}
												name="oriPassword" // input
												onChange={handleChange}
												onBlur={handleBlur}
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																aria-label="toggle password visibility"
																onClick={handleClickShowOriPassword}
																onMouseDown={handleMouseDownOriPassword}
																edge="end"
															>
																{showOriPassword ? <Visibility /> : <VisibilityOff />}
															</IconButton>
														</InputAdornment>
													)
												}}
											/>
										</FormControl>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<FormControl sx={{width: "300px"}}>
											<TextField
												type={showPassword ? 'text' : 'password'}
												label="密碼"
												value={values.password}
												name="password" // input
												onChange={handleChange}
												onBlur={handleBlur}
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																aria-label="toggle password visibility"
																onClick={handleClickShowPassword}
																onMouseDown={handleMouseDownPassword}
																edge="end"
															>
																{showPassword ? <Visibility /> : <VisibilityOff />}
															</IconButton>
														</InputAdornment>
													)
												}}
											/>
										</FormControl>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<FormControl sx={{width: "300px"}}>
											<TextField
												type={showPasswordConfirm ? 'text' : 'password'}
												label="再輸入一次密碼"
												value={values.passwordConfirm}
												name="passwordConfirm" // input
												onChange={handleChange}
												onBlur={handleBlur}
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																aria-label="toggle password visibility"
																onClick={handleClickShowPasswordConfirm}
																onMouseDown={handleMouseDownPasswordConfirm}
																edge="end"
															>
																{showPasswordConfirm ? <Visibility /> : <VisibilityOff />}
															</IconButton>
														</InputAdornment>
													)
												}}
											/>
										</FormControl>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}} container alignItems="center" justifyContent="center">
										<Grid item xs={4}>
											<Button
												// disableElevation
												// disabled={isSubmitting}
												size="large"
												type="submit"
												variant="contained"
												color="secondary"
												sx={{whiteSpace: "nowrap", minWidth: "auto",}}
											>
												儲存設定
											</Button>
										</Grid>
									</Grid>
								</Grid>
							</Grid>
						</form>
					)}
				</Formik>

				<Button variant="text" onClick={() => navigate("/PersonalPage")} sx={{ color: "#2074d4" }}>
					<Typography variant="body1" component="div">
						回到個人頁面
					</Typography>
				</Button>
			</CardContent>
		</Card>
	)
}

export default ChangeInfo;