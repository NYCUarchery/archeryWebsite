
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Formik } from 'formik';

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';


import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import parse from 'date-fns/parse';
import formatISO from 'date-fns/formatISO';

import * as Yup from 'yup';

const CreateContestPage = () => {
	// date: new Date(),
	return (
		<Card sx={{p: 2}}>
			<CardContent>
				<Grid container alignItems="center" justifyContent="center" spacing={2}>
					<Grid item sx={{width: "auto"}}>
						<Formik
							initialValues={{
								name: "",
								bowType: "",
								distance: "",
								date: new Date(),
							}}
							validationSchema={Yup.object().shape({
								bowType: Yup.string().max(255).oneOf(["composite", "recurve", ""], "").required('請填入弓種'),
								date: Yup.date().required('請填入日期'),
								name: Yup.string().max(255).required('請填入名稱'),
								distance: Yup.number().required('請填入距離'),
							})}
							onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
								const dateString = formatISO(values.date);
								const body = new FormData();
								body.append("name", values.name);
								body.append("bowType", values.bowType);
								body.append("distance", values.distance);
								body.append("date", dateString);
								console.log("body: ", body)

								try {
									fetch("http://localhost:8080/api/createContest", {
										method: "POST",
										body,
									})
									.then((res) => {
										return res.json();
									})
									.then((resjson) => {

										console.log(resjson);
										if (resjson["result"] && resjson["result"] === "success") {
											console.log("Log In Success");
										} else {
											console.log("Too bad QQ");
										}
									});
								} catch (err) {
									console.log(err);
								}
							}}
						>
							{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
								<form noValidate onSubmit={handleSubmit}>
									<Grid container direction="column" alignItems="stretch" justifyContent="center" spacing={2}>
										<Grid item xs={2}>
											<FormControl required sx={{minWidth: "100px"}} error={Boolean(touched.date && touched.bowType && touched.distance && touched.name)}>
												{/* <InputLabel id="createContestDateSelect">日期</InputLabel> */}
    										<LocalizationProvider dateAdapter={AdapterDateFns}>
													<DatePicker
														label="日期"
														value={values.date}
														// onChange={(e) => setFieldValue("date", parse(e), true)}
														onChange={(e) => e}
														// renderInput={(params) => <TextField {...params} />}
														slotProps={{textField: {required: true}}}
													/>
												</LocalizationProvider>

												{touched.date && errors.date && (
													<FormHelperText error>
														{' '}
														{/* {errors.date}{' '} */}
													</FormHelperText>
												)}
											</FormControl>
										</Grid>
										<Grid item xs={2}>
											<FormControl required error={Boolean(touched.date && touched.bowType && touched.distance && touched.name)}>
												<InputLabel id="createContestBowTypeSelect">弓種</InputLabel>
												<Select
													label="弓種"
													labelId="createContestBowTypeSelect"
													value={values.bowType}
													name="bowType"
													onChange={handleChange}
													onBlur={handleBlur}
												>
													<MenuItem value={"composite"}>複合弓</MenuItem>
													<MenuItem value={"recurve"}>反曲弓</MenuItem>
												</Select>

												{touched.bowType && errors.bowType && (
													<FormHelperText error>
														{' '}
														{errors.bowType}{' '}
													</FormHelperText>
												)}
											</FormControl>
										</Grid>

										<Grid item xs={2}>
											<FormControl sx={{width: "300px"}} error={Boolean(touched.date && touched.bowType && touched.distance && touched.name)}>
												<TextField
													required
													label="距離(m)"
													value={values.distance}
													type='number'
													name="distance"
													onChange={handleChange}
													onBlur={handleBlur}
													InputProps={{
														inputProps: { min: 0, max: 1000, step: 10 }
													}}
												/>

												{touched.distance && errors.distance && (
													<FormHelperText error>
														{' '}
														{errors.distance}{' '}
													</FormHelperText>
												)}
											</FormControl>
										</Grid>

										<Grid item xs={2}>
											<FormControl sx={{width: "300px"}} error={Boolean(touched.date && touched.bowType && touched.distance && touched.name)}>
												<TextField
													required
													label="名稱"
													value={values.name}
													name="name"
													onChange={handleChange}
													onBlur={handleBlur}
												/>

												{touched.name && errors.name && (
													<FormHelperText error>
														{' '}
														{errors.name}{' '}
													</FormHelperText>
												)}
											</FormControl>
										</Grid>

										<Grid item container alignItems="center" justifyContent="center">
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
													創建比賽
												</Button>
											</Grid>
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

export default CreateContestPage;