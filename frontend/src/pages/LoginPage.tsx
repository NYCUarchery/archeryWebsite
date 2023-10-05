
import { useState, Dispatch, SetStateAction, FC } from 'react';

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

import { host, api } from '../util/api';
import routing from '../util/routing';

interface LoginPageProps {
  setAuthorized: Dispatch<SetStateAction<boolean>>;
	setPath: Dispatch<SetStateAction<string>>;
}

const LoginPage: FC<LoginPageProps> = ({setAuthorized, setPath}) => {
	const [showPassword, setShowPassword] = useState(false);

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = (e: any) => {
		e.preventDefault();
	};

	const navigate = useNavigate();

	// fetch(`${host}/${api.user.getUserID}`, {
  //   method: "GET",
  //   credentials: "include",
  // })
  // .then((res) => {
	// 	// console.log("res: ", res)
  //   return res.json();
  // })
  // .then((resjson) => {
  //   console.log(resjson);
  //   if (resjson["uid"]) {
  //     setAuthorized(true);
	// 		navigate(routing.Home);
  //   }
  // });

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
								password: "",
							}}
							validationSchema={Yup.object().shape({
								username: Yup.string().max(255).required('Username is required'),
								password: Yup.string().max(255).required('Password is required')
							})}
							onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
								const body = new FormData();
								body.append("username", values.username);
								body.append("password", values.password);
								fetch(`${host}/${api.user.login}`, {
									method: "POST",
									body,
									credentials: "include",
								})
								.then((res) => {
									console.log("res: ", res);
									switch(res.status) {
										case 200:
											setAuthorized(true);
											navigate(routing.Home);
											break;
										case 401:
											window.alert("有人帳號或密碼打錯囉");
											break;
									}
									return res.json();
								})
								.then((resjson) => {
								})
								.catch((err) => {
									console.log(err)
								});
								
							}}
						>
							{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
								<form noValidate onSubmit={handleSubmit}>

									<Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
										<Grid item xs={2}>
											<OneLineField
												touched={touched.username && touched.password}
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
												touched={touched.username && touched.password}
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
										<Grid item xs={1}>
											<Grid container justifyContent="flex-end">
												<Grid item xs={2} sx={{pl: "150px", width: "20px"}}>
													<Typography
														variant="caption"
														component={Button}
														onClick={() => {
															window.alert("Try to figure out by yourself")
														}}
														color="secondary"
														noWrap={true}
														sx={{ textDecoration: 'none', maxWidth: "20px"}}
													>
														忘記密碼
													</Typography>
												</Grid>
											</Grid>
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
													登入
												</Button>
											</Box>
										</Grid>

										<Grid item xs={1}>
											<Typography
												variant="caption"
												component={Button}
												onClick={() => {
													setPath("/Signup");
													navigate(routing.Signup);
												}}
												// component={Link}
												// to={props.login ? '/pages/forgot-password/forgot-password' + props.login : '#'}
												color="secondary"
												noWrap={true}
												sx={{ textDecoration: 'none'}}
											>
												沒有帳號嗎？
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

export default LoginPage;


{/* <Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
<Grid item xs={2}>
	<Typography variant="h6" component="div">
		ARCHERY
	</Typography>
</Grid>
<Grid item xs={2}>
	<TextField
		required
		label="Username"
		value={values.username}
		onChange={handleChange}
		onBlur={handleBlur}
	/>
</Grid>
<Grid item xs={2}>
	<TextField
		required
		label="Password"
		value={values.password}
		onChange={handleChange}
	/> */}