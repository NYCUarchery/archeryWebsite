import { useState } from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";

import { useNavigate } from "react-router-dom";

import useGetInstitutions from "../util/QueryHooks/useGetInstitution";

import routing from "../util/routing";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [institutionID, setInstitutionID] = useState(0);
  const [overview, setOverview] = useState("");
  const { data: institutions } = useGetInstitutions();

  const institutionsOptions = institutions?.map((institution: any) => {
    return { value: institution.id, label: institution.name };
  });

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
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <Grid
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Grid item xs={2}>
            <Typography variant="h6" component="div">
              ARCHERY
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Grid
              container
              direction="column"
              alignItems="center"
              justifyContent="center"
              spacing={2}
            >
              <Grid item xs={2}>
                <TextField
                  label="帳號"
                  variant="outlined"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                  }}
                  sx={{ mb: "10px" }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="密碼"
                  variant="outlined"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                  sx={{ mb: "10px" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="確認密碼"
                  variant="outlined"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value);
                  }}
                  sx={{ mb: "10px" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPasswordConfirm}
                          onMouseDown={handleMouseDownPasswordConfirm}
                          edge="end"
                        >
                          {showPasswordConfirm ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="真實姓名"
                  variant="outlined"
                  value={realName}
                  onChange={(event) => {
                    setRealName(event.target.value);
                  }}
                  sx={{ mb: "10px" }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="電子郵件"
                  variant="outlined"
                  value={email}
                  sx={{ mb: "10px" }}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="組織/學校"
                  variant="outlined"
                  value={institutionID}
                  select
                  sx={{ mb: "10px" }}
                  onChange={(event) => {
                    event.target.value === ""
                      ? setInstitutionID(0)
                      : setInstitutionID(parseInt(event.target.value));
                  }}
                >
                  <MenuItem value={0} key={0} disabled>
                    選擇組織/學校
                  </MenuItem>
                  {institutionsOptions?.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="自我介紹"
                  variant="outlined"
                  value={overview}
                  multiline
                  rows={4}
                  sx={{ mb: "10px" }}
                  onChange={(event) => {
                    setOverview(event.target.value);
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <Box sx={{ mb: "10px" }}>
                  <Button
                    // disableElevation
                    // disabled={isSubmitting}
                    size="large"
                    type="submit"
                    variant="contained"
                    color="secondary"
                  >
                    註冊
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={1}>
                <Typography
                  variant="caption"
                  component={Button}
                  onClick={() => {
                    navigate(routing.Login);
                  }}
                  color="secondary"
                  noWrap={true}
                >
                  已有帳號
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SignupPage;
