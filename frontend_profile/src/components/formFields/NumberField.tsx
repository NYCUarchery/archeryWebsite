
import { FormControl } from '@mui/material';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import { FC } from 'react';

interface NumberFieldProp {
	touched: any,
	error: any,
	handleChange: any,
	handleBlur: any,
	name: any,
	label: any,
	value: any,
	numberprop: any,
	sx?: any,
}

const NumberField: FC<NumberFieldProp> = ({ touched, error, handleChange, handleBlur, name, label, value, numberprop, sx }) => {
	return (
		<FormControl required sx={sx == undefined?{width: "300px"}: sx} error={Boolean(touched)}>
			
			<TextField
				required
				label={label}
				type="number"
				value={value}
				name={name}
				onChange={handleChange}
				onBlur={handleBlur}
				inputProps={{
					step: numberprop.step,
					max: numberprop.max,
					min: numberprop.min,
				}}
			/>

			{touched && error && (
				<FormHelperText error>
					{error}
				</FormHelperText>
			)}
		</FormControl>
	)
}

export default NumberField;
