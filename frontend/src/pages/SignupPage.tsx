
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { useState, Dispatch, SetStateAction, FC } from 'react';
import TextField from '@mui/material/TextField';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useNavigate } from 'react-router-dom';

import * as Yup from 'yup';
import { Formik } from 'formik';
import { FormControl } from '@mui/material';

interface SignupPageProps {
	setPath: Dispatch<SetStateAction<string>>;
}

const SignupPage: FC<SignupPageProps> = ({setPath}) => {
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
			<Grid container direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: '100vh'}}>
				<Grid item xs={6} sm={12}>
					<Card>
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
											passwordConfirm: "",
										}}
										validationSchema={Yup.object().shape({
											username: Yup.string().max(255).required('Username is required'),
											password: Yup.string().min(6, "Password should be longer than 6 characters").max(255).required('Password is required'),
											passwordConfirm: Yup.string().required('Confirm your password').oneOf([Yup.ref("password"), ""], "Password must match"),
											// passwordConfirm: Yup.string()
											// 	.test('passwords-match', 'Passwords must match', function(value){
											// 		return this.parent.password === value
											// 	})
										})}
										onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
											try {
												console.log(values)
											} catch (err) {
											}
									}}
									>
										{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
											<form noValidate onSubmit={handleSubmit}>

												<Grid container direction="column" alignItems="center" justifyContent="center" spacing={2}>
													<Grid item xs={2}>
														<FormControl sx={{width: "300px"}} error={Boolean(touched.username && touched.password && touched.passwordConfirm)}>
															<TextField
																required
																label="Username"
																value={values.username}
																name="username" // input
																onChange={handleChange}
																onBlur={handleBlur}
															/>

															{touched.username && errors.username && (
																	<FormHelperText error id="standard-weight-helper-text-email-login">
																			{' '}
																			{errors.username}{' '}
																	</FormHelperText>
															)}
														</FormControl>
													</Grid>
													<Grid item xs={2}>
														<FormControl sx={{width: "300px"}} error={Boolean(touched.username && touched.password && touched.passwordConfirm)}>
															<TextField
																required
																type={showPassword ? 'text' : 'password'}
																label="password"
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

															{touched.password && errors.password && (
																	<FormHelperText error id="standard-weight-helper-text-email-login">
																			{' '}
																			{errors.password}{' '}
																	</FormHelperText>
															)}
														</FormControl>
													</Grid>
													<Grid item xs={2}>
														<FormControl sx={{width: "300px"}} error={Boolean(touched.username && touched.password && touched.passwordConfirm)}>
															<TextField
																required
																type={showPasswordConfirm ? 'text' : 'password'}
																label="Confirm your password"
																value={values.passwordConfirm}
																name="passwordConfirm" // input
																onChange={handleChange}
																onBlur={handleBlur}
																InputProps={{
																	endAdornment: (
																		<InputAdornment position="end">
																			<IconButton
																					aria-label="toggle confirm password visibility"
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

															{touched.password && errors.password && (
																	<FormHelperText error id="standard-weight-helper-text-email-login">
																			{' '}
																			{errors.password}{' '}
																	</FormHelperText>
															)}
														</FormControl>
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
																	Sign Up
															</Button>
														</Box>
													</Grid>

													<Grid item xs={1}>
														<Typography
															variant="caption"
															component={Button}
															onClick={() => {
																setPath("/Login");
																navigate("/Login");
															}}
															// component={Link}
															// to={props.login ? '/pages/forgot-password/forgot-password' + props.login : '#'}
															color="secondary"
															noWrap={true}
															sx={{ textDecoration: 'none'}}
														>
															Back to Login
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
				</Grid>
			</Grid>
	)
}

export default SignupPage;
