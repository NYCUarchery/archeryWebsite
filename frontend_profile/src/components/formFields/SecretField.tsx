import { FormControl } from '@mui/material';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormHelperText from '@mui/material/FormHelperText';
import { FC } from 'react';

interface secretFieldProp {
	touched: any,
	error: any,
	handleChange: any,
	handleBlur: any,
	name: any,
	label: any,
	value: any,
	required?: any,
	secret: any,
}

const SecretField: FC<secretFieldProp> = ({ touched, error, handleChange, handleBlur, name, label, value, required, secret }) => {
	return (
		<FormControl sx={{width: "300px"}} error={Boolean(touched)}>
			<TextField
				required={required == undefined? false:required}
				type={secret.show ? 'text' : 'password'}
				label={label}
				value={value}
				name={name} // input
				onChange={handleChange}
				onBlur={handleBlur}
				InputProps={{
					endAdornment: (
						<InputAdornment position="end">
							<IconButton
								aria-label="toggle confirm password visibility"
								onClick={secret.click}
								onMouseDown={secret.mousedown}
								edge="end"
							>
								{secret.show ? <Visibility /> : <VisibilityOff />}
							</IconButton>
						</InputAdornment>
					)
				}}
			/>

			{touched && error && (
				<FormHelperText error id="standard-weight-helper-text-email-login">
					{' '}
					{error}{' '}
				</FormHelperText>
			)}
		</FormControl>
	)
}

export default SecretField;