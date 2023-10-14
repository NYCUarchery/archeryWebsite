
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import avatar from "../assets/images/avatar.jpg";
import { Formik } from 'formik';
import routing from '../util/routing';
import { useState } from 'react';
import OneLineField from '../components/formFields/OneLineField';
import MultiLineField from '../components/formFields/MultiLineField';
import SecretField from '../components/formFields/SecretField';
import { userStore } from '../util/userReducer';
import { ModifyUserInfo } from '../util/api';

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
						username: "",
						overview: "你以為你躲起來就找不到你了嗎，沒有用的。你是那樣拉風的男人，不管在什麼地方，就好像漆黑中的螢火蟲一樣，是那樣的鮮明，那樣的出眾。你那憂鬱的眼神，唏噓的鬍渣子，隨意叼著的牙籤，還有那杯 dry martine ，都深深的迷住了我。張嘉航,你真是電競界的罪人,你害怕你強大的天賦會蓋過其他人,選擇在接觸遊戲十年後再出道,而放棄與你的宿敵 FAKER 競爭神的寶座,今年該是你奪回神寶座的時候了。",
						oriPassword: "",
						password: "",
						passwordConfirm: "",
						organization: "",
					}}
					onSubmit={async (values) => {
						try {
							const uid = userStore.getState().uid; 
							await ModifyUserInfo(uid, values);
							navigate(routing.Personal)
						} catch (error) {}
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
										<OneLineField
											touched={touched.username}
											error={errors.username}
											handleChange={handleChange}
											handleBlur={handleBlur}
											name={"username"}
											label={"暱稱"}
											value={values.username}
										/>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<OneLineField
											touched={touched.organization}
											error={errors.organization}
											handleChange={handleChange}
											handleBlur={handleBlur}
											name={"organization"}
											label={"所屬組織"}
											value={values.organization}
										/>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<MultiLineField
											touched={touched.overview}
											error={errors.overview}
											handleChange={handleChange}
											handleBlur={handleBlur}
											name={"overview"}
											label={"自我介紹"}
											value={values.overview}
										/>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<SecretField
											touched={touched.oriPassword}
											error={errors.oriPassword}
											handleChange={handleChange}
											handleBlur={handleBlur}
											name={"oriPassword"}
											label={"請輸入原本密碼"}
											value={values.oriPassword}
											secret={{
												click: handleClickShowOriPassword,
												mousedown: handleMouseDownOriPassword,
												show: showOriPassword,
											}}
										/>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<SecretField
											touched={touched.password}
											error={errors.password}
											handleChange={handleChange}
											handleBlur={handleBlur}
											name={"password"}
											label={"新密碼"}
											value={values.password}
											secret={{
												click: handleClickShowPassword,
												mousedown: handleMouseDownPassword,
												show: showPassword,
											}}
										/>
									</Grid>
									<Grid item xs={12} sx={{mt: 2}}>
										<SecretField
											touched={touched.passwordConfirm}
											error={errors.passwordConfirm}
											handleChange={handleChange}
											handleBlur={handleBlur}
											name={"passwordConfirm"}
											label={"再輸入一次新密碼"}
											value={values.passwordConfirm}
											secret={{
												click: handleClickShowPasswordConfirm,
												mousedown: handleMouseDownPasswordConfirm,
												show: showPasswordConfirm,
											}}
										/>
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

				<Button variant="text" onClick={() => navigate(routing.Personal)} sx={{ color: "#2074d4" }}>
					<Typography variant="body1" component="div">
						回到個人頁面
					</Typography>
				</Button>
			</CardContent>
		</Card>
	)
}

export default ChangeInfo;