import { FormControl } from '@mui/material';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import { FC } from 'react';

interface MultiLineFieldProp {
	touched: any,
	error: any,
	handleChange: any,
	handleBlur: any,
	name: any,
	label: any,
	value: any,
}

const MultiLineField: FC<MultiLineFieldProp> = ({ touched, error, handleChange, handleBlur, name, label, value }) => {
	return (
		<FormControl>
			<TextField
				label={label}
				value={value}
				name={name}
				onChange={handleChange}
				onBlur={handleBlur}
				multiline
				rows={4}
				sx={{ 
					maxHeight: "200px", overflowY: "scroll", pt: "5px",
					'&::-webkit-scrollbar': {
						width: '1px'
					}, 
					"& label": {
						mt: 0.8
					},
					'userSelect': 'none',
					width: { sm: "350px", xs: "300px"},
				}}
			/>
		</FormControl>
	)
}

export default MultiLineField;
