import { FormControl } from '@mui/material';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import { FC } from 'react';

interface OneLineFieldProp {
	touched: any,
	error: any,
	handleChange: any,
	handleBlur: any,
	name: any,
	label: any,
	value: any,
	required?: any,
	sx?: any,
}

const OneLineField: FC<OneLineFieldProp> = ({ touched, error, handleChange, handleBlur, name, label, value, required, sx }) => {
	return (
		<FormControl sx={sx == undefined?{width: "300px"}: sx} error={Boolean(touched)}>
			<TextField
				required={required == undefined? false:required}
				label={label}
				value={value}
				name={name} // input
				onChange={handleChange}
				onBlur={handleBlur}
			/>
			{error && (
				<FormHelperText error id="standard-weight-helper-text-email-login">
					{' '}
					{error}{' '}
				</FormHelperText>
			)}
		</FormControl>
	)
}

export default OneLineField;