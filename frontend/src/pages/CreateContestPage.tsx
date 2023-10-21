import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';

import { useNavigate } from 'react-router-dom';
import { Formik, FieldArray, Field } from 'formik';
import formatISO from 'date-fns/formatISO';
import * as Yup from 'yup';

import OneLineField from '../components/formFields/OneLineField';
import MultiLineInput from '../components/formFields/MultiLineField';
import NumberField from '../components/formFields/NumberField';


import api from '../util/api';
import routing from '../util/routing';


const CreateContestPage = () => {
	const navigate = useNavigate();
	return (
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Grid container alignItems="stretch" justifyContent="flexstart" spacing={2}>
					<Grid item sx={{width: "100%"}}>
						<Formik
							initialValues={{
								name: "",
								overview: "",
								date: new Date(),
								groups: ["", ],
								scoreboardURL: "",
								categories: [{"des": "", "dis": 70}, ],
								organization: "",

								description: "",
								distance: "70",
							}}
							validationSchema={Yup.object().shape({
								name: Yup.string().max(255).required('請填入名稱'),
								// date: Yup.date().required('請填入日期'),
							})}
							onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
								const dateString = formatISO(values.date);
								const body = new FormData();
								body.append("name", values.name);
								body.append("date", dateString);
								body.append("overview", values.overview);
								body.append("organization", values.organization);
								body.append("scoreboardURL", values.scoreboardURL);

								values.categories.map((v, i) => {
									body.append("categories", JSON.stringify(v));
								})

								fetch(`${api.competition.create}`, {
									method: "POST",
									credentials: "include",
									body,
								})
								.then((res) => {
									if (res.status === 200) {
										// window.alert("創造成功");
									} else if (res.status === 400) {
										// window.alert("名稱、日期、資訊有誤");
									} else if (res.status === 500) {
										window.alert("後端好像壞啦ouo 怕爆><");
									}
									return res.json();
								})
								.then((resjson) => {
									if (!resjson["result"]) {return;}
									switch(resjson["result"]) {
										case "competition name exists":
											window.alert("比賽名稱已存在");
											break;
										case "cannot parse date string":
											window.alert("日期字串有誤（我的問題）");
											break;
										case "invalid categories":
											window.alert("組別資料有誤（還是我的問題）");
											break;
										case "success":
											window.alert(`大成功 id= ${resjson["compID"]}`);
											navigate(routing.Contests);
											break;
									}
								})
								.catch((err) => console.log(err));
							}}
						>
							{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => {
								return (
									<form noValidate onSubmit={handleSubmit}>
										<Grid container direction="column" alignItems="stretch" justifyContent="center" spacing={2}>
											<Grid item xs={2}>
												<OneLineField
													touched={touched.name}
													error={errors.name}
													handleChange={handleChange}
													handleBlur={handleBlur}
													name={"name"}
													label={"名稱"}
													value={values.name}
												/>
											</Grid>
											<Grid item xs={2}>
												<MultiLineInput
													touched={touched.overview}
													error={errors.overview}
													handleChange={handleChange}
													handleBlur={handleBlur}
													name={"overview"}
													label={"敘述"}
													value={values.overview}
												/>
											</Grid>
											<Grid item xs={2}>
												<FormControl required sx={{width: "300px"}} error={Boolean(touched.name && touched.date && touched.groups && touched.overview && touched.distance && touched.description)}>
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
												</FormControl>
											</Grid>
											<Grid item xs={2}>
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
											<Grid item xs={2}>
												<OneLineField
													touched={touched.scoreboardURL}
													error={errors.scoreboardURL}
													handleChange={handleChange}
													handleBlur={handleBlur}
													name={"scoreboardURL"}
													label={"記分板"}
													value={values.scoreboardURL}
												/>
											</Grid>
											<Grid item xs={2}>
												<FieldArray
													name="categories"
													render={(arrayHelpers: any) => (
														<Grid container flexDirection="column" alignItems="flexstart" justifyContent="flexstart" gap={2}>
															<Grid item xs={10} container flexDirection="row" alignItems="center" justifyContent="flexstart" gap={2}>
																{values.categories && values.categories.length > 0 && (values.categories.map((v, i) => (
																	<Grid key={i} item sx={{minWidth: "300px", maxWidth: "300px"}} container flexDirection="row" justifyContent="center" alignItems="center">
																		<Grid item xs={8} container flexDirection="column" gap={1}>
																			<Grid item xs={2}>
																				<OneLineField
																					sx={{width: "200px"}}
																					touched={touched.categories}
																					error={errors.categories}
																					handleChange={handleChange}
																					handleBlur={handleBlur}
																					name={`categories[${i}]["des"]`}
																					label={"敘述"}
																					value={values.categories[i]["des"]}
																				/>
																			</Grid>
																			<Grid item xs={2}>
																				<NumberField
																					sx={{width: "200px"}}
																					touched={touched.categories}
																					error={errors.categories}
																					handleChange={handleChange}
																					handleBlur={handleBlur}
																					name={`categories[${i}]["dis"]`}
																					label={"距離"}
																					value={values.categories[i]["dis"]}
																					numberprop={{
																						step: "5",
																						max: "150",
																						min: "20",
																					}}
																				/>
																			</Grid>
																		</Grid>
																		<Grid item sx={{maxWidth: "64px", width: "64px", p: 0}}>
																			<Button
																				onClick={() => {
																					arrayHelpers.remove(i);
																				}}
																				sx={{maxWidth: "64px", width: "64px", pl: 0, pr: 0}}
																			>
																				<DeleteIcon fontSize="small" sx={{pl: -2, pr: -2,}}/>
																			</Button>
																		</Grid>
																	</Grid>
																)))}
															</Grid>
															<Grid item xs={2}>
																<Button
																	// disableElevation
																	// disabled={isSubmitting}
																	size="large"
																	onClick={() => {
																		arrayHelpers.push({"des": "", "dis": 70});
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

											<Grid item container flexDirection="column" alignItems="center" justifyContent="center">
												<Grid item xs={12}>
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