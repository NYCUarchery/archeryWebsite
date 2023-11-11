import { useState } from 'react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik } from 'formik';

import OneLineField from '../components/formFields/OneLineField';
import SecretField from '../components/formFields/SecretField';
import MultiLineInput from '../components/formFields/MultiLineField';

import routing from '../util/routing';
import { registerUser } from '../util/api';


const SignupPage = () => {
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleClickShowPasswordConfirm = () => {
		setShowPasswordConfirm(!showPasswordConfirm);
	};

	const handleMouseDownPassword = (e: any) => {
		e.preventDefault();
	};

	const handleMouseDownPasswordConfirm = (e: any) => {
		e.preventDefault();
	};


	const navigate = useNavigate();

	return (
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
					<Grid item xs={2}>
						<Typography variant="h6" component="div">
							ARCHERY
						</Typography>
					</Grid>
					<Grid item xs={6}>
						<Formik
							initialValues={{
								username: "",
								overview: "",
								password: "",
								passwordConfirm: "",
								email: "",
								institutionID: "",
							}}
							validationSchema={Yup.object().shape({
								username: Yup.string().max(255).required('Username is required'),
								password: Yup.string().min(6, "Password should be longer than 6 characters").max(255).required('Password is required'),
								passwordConfirm: Yup.string().oneOf([Yup.ref("password"), ""], "Password must match").required('Confirm your password'),
							})}
							onSubmit={async (values: any) => {
								try {
									const result = await registerUser(values);
									if (result.result === "success") {
										window.alert("成功註冊 讚");
										navigate(routing.Login);
									}
								} catch (error) { }
							}}
						>
							{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
								<form noValidate onSubmit={handleSubmit}>

									<Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
										<Grid item xs={2}>
											<OneLineField
												touched={touched.username && touched.password && touched.passwordConfirm}
												error={errors.username}
												handleChange={handleChange}
												handleBlur={handleBlur}
												name={"username"}
												label={"帳號"}
												value={values.username}
											/>
										</Grid>
										<Grid item xs={2}>
											<SecretField
												touched={touched.username && touched.password && touched.passwordConfirm}
												error={errors.password}
												handleChange={handleChange}
												handleBlur={handleBlur}
												name={"password"}
												label={"密碼"}
												value={values.password}
												secret={{
													click: handleClickShowPassword,
													mousedown: handleMouseDownPassword,
													show: showPassword,
												}}
											/>
										</Grid>
										<Grid item xs={2}>
											<SecretField
												touched={touched.username && touched.password && touched.passwordConfirm}
												error={errors.passwordConfirm}
												handleChange={handleChange}
												handleBlur={handleBlur}
												name={"passwordConfirm"}
												label={"再輸入一次密碼"}
												value={values.passwordConfirm}
												secret={{
													click: handleClickShowPasswordConfirm,
													mousedown: handleMouseDownPasswordConfirm,
													show: showPasswordConfirm,
												}}
											/>
										</Grid>
										<Grid item xs={2}>
											<OneLineField
												touched={touched.email}
												error={errors.email}
												handleChange={handleChange}
												handleBlur={handleBlur}
												name={"email"}
												label={"電子郵件"}
												value={values.email}
											/>
										</Grid>
										<Grid item xs={2}>
											<OneLineField
												touched={touched.username && touched.password && touched.passwordConfirm}
												error={errors.institutionID}
												handleChange={handleChange}
												handleBlur={handleBlur}
												name={"institutionID"}
												label={"所屬組織"}
												value={values.institutionID}
											/>
										</Grid>
										<Grid item xs={2}>
											<MultiLineInput
												touched={touched.username && touched.password && touched.passwordConfirm}
												error={errors.overview}
												handleChange={handleChange}
												handleBlur={handleBlur}
												name={"overview"}
												label={"自我介紹"}
												value={values.overview}
											/>
										</Grid>
										<Grid item xs={2}>
											<Box
												sx={{
													mt: 2
												}}
											>
												<Button
													// disableElevation
													// disabled={isSubmitting}
													size="large"
													type="submit"
													variant="contained"
													color="secondary"
												>
													註冊
												</Button>
											</Box>
										</Grid>

										<Grid item xs={1}>
											<Typography
												variant="caption"
												component={Button}
												onClick={() => {
													navigate(routing.Login);
												}}
												color="secondary"
												noWrap={true}
												sx={{ textDecoration: 'none'}}
											>
												已有帳號
											</Typography>
										</Grid>
									</Grid>
								</form>
							)}
						</Formik>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	)
}

export default SignupPage;
