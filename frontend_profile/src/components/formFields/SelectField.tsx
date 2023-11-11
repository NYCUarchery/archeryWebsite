import { FormControl } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import { FC } from 'react';

interface SelectFieldProp {
	touched: any,
	error: any,
	handleChange: any,
	handleBlur: any,
	name: any,
	label: any,
	value: any,
	menuitems: any,
	required?: any,
	sx?: any,
}

const SelectField: FC<SelectFieldProp> = ({ touched, error, handleChange, handleBlur, name, label, value, menuitems, required, sx }) => {
	return (
		<FormControl sx={sx == undefined?{width: "300px"}: sx} error={Boolean(touched)}>
			<Select
				required={required == undefined? false:required}
				label={label}
				value={value}
				name={name} // input
				onChange={handleChange}
				onBlur={handleBlur}
			>
				{menuitems.map((i: any, v: any) => (
					<MenuItem key={i} value={i}>
						{v}
					</MenuItem>
				))}
			</Select>
			{error && (
				<FormHelperText error id="standard-weight-helper-text-email-login">
					{error}
				</FormHelperText>
			)}
		</FormControl>
	)
}

export default SelectField;