import { useState } from "react";

import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

import { useNavigate } from "react-router-dom";

import routing from "../util/routing";

import { useMutation } from "react-query";
import axios from "axios";

const login = (body: any) => axios.post("/api/session", body);

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { mutate: loginMutation, isLoading: isLoadingLogin } = useMutation(
    login,
    {
      onSuccess: () => {
        window.location.href = routing.Home;
      },
    }
  );

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (e: any) => {
    e.preventDefault();
  };

  const handleLogin = () => {
    loginMutation({ user_name: userName, password: password });
  };
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
                  value={userName}
                  onChange={(event) => {
                    setUserName(event.target.value);
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
                <Box
                  sx={{
                    mt: 2,
                  }}
                >
                  <Button
                    disabled={isLoadingLogin}
                    size="large"
                    type="submit"
                    variant="contained"
                    color="secondary"
                    onClick={handleLogin}
                  >
                    登入
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={1}>
                <Typography
                  variant="caption"
                  component={Button}
                  onClick={() => {
                    navigate(routing.Signup);
                  }}
                  color="secondary"
                  noWrap={true}
                  sx={{ textDecoration: "none" }}
                >
                  沒有帳號嗎？
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
