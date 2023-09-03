
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Formik, FieldArray, Field } from 'formik';

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import Divider from '@mui/material/Divider';


import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import DeleteIcon from '@mui/icons-material/Delete';


import parse from 'date-fns/parse';
import formatISO from 'date-fns/formatISO';

import * as Yup from 'yup';


const CreateContestPage = () => {
	// date: new Date(),
	return (
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Grid container alignItems="stretch" justifyContent="flexstart" spacing={2}>
					<Grid item sx={{width: "100%"}}>
						<Formik
							initialValues={{
								name: "",
								date: new Date(),
								groups: ["", ],
							}}
							validationSchema={Yup.object().shape({
								date: Yup.date().required('請填入日期'),
								name: Yup.string().max(255).required('請填入名稱'),
							})}
							onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
								const dateString = formatISO(values.date);
								const body = new FormData();
								// body: {
								// 	name: "",
								// 	date: "",
								// 	groups: ["", "",  ...], (stringify)
								// }
								body.append("name", values.name);
								body.append("date", dateString);
								values.groups.map((v, i) => {
									body.append("groups", v);
								})
								// body.append("groups", JSON.stringify(values.groups));
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
							{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => {
								return (
									<form noValidate onSubmit={handleSubmit}>
										<Grid container direction="column" alignItems="stretch" justifyContent="center" spacing={2}>
											<Grid item xs={2}>
												<FormControl required sx={{minWidth: "100px"}} error={Boolean(touched.date && touched.groups && touched.name)}>
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
												<FormControl sx={{width: "300px"}} error={Boolean(touched.date && touched.groups && touched.name)}>
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
											<Grid item xs={2}>
												<FieldArray
													name="groups"
													render={(arrayHelpers: any) => (
														<Grid container flexDirection="column" alignItems="flexstart" justifyContent="flexstart">
															<Grid item xs={10} container flexDirection="row" alignItems="center" justifyContent="flexstart" sx={{minWidth: "500px"}}>
																{values.groups && values.groups.length > 0? (values.groups.map((v, i) => (
																	<Grid key={i} item xs={12} sm={6} sx={{p: 2, m: 0}}>
																		<FormControl required error={Boolean(touched.date && touched.groups && touched.name)}>
																			<Grid container flexDirection="row" alignItems="center" justifyContent="center" sx={{m: 0, p: 0}}>
																				<Grid item xs={10}>
																					<Field
																						name={`groups[${i}]`}
																						value={values.groups[i]}
																						placeholder="50公尺複合弓"
																						type="text"
																						fullWidth
																						sx={{minWidth: "200px", maxWidth: "200px"}}
																						as={TextField} // use as to render a textfield, using 'component' need to handle the focus problem
																					/>
																				</Grid>
																				<Grid item xs={2} sx={{width: "30px", p: 0}}>
																					<Button
																						onClick={() => {
																							arrayHelpers.remove(i);
																							console.log("i: ", i)
																						}}
																						sx={{width: "auto", pl: 0, pr: 0}}
																					>
																						<DeleteIcon fontSize="small" sx={{width: "auto", pl: -2, pr: -2}}/>
																					</Button>
																				</Grid>
																			</Grid>

																			{touched.groups && errors.groups && (
																				<FormHelperText error>
																					{' '}
																					{errors.groups}{' '}
																				</FormHelperText>
																			)}
																		</FormControl>
																	</Grid>
																))) : <></>}
															</Grid>
															<Grid item xs={2}>
																<Button
																	// disableElevation
																	// disabled={isSubmitting}
																	size="large"
																	// type=""
																	onClick={() => {
																		console.log(values.groups)
																		arrayHelpers.push('');
																	}}
																	variant="contained"
																	color="secondary"
																	sx={{whiteSpace: "nowrap", minWidth: "auto",}}
																>
																	新增組別
																</Button>
															</Grid>
														</Grid>
													)}
												/>
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
							)}}

						</Formik>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	)
}

export default CreateContestPage;