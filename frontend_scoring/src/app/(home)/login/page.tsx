"use client";
import { useState } from "react";

import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";

import { useMutation, useQueryClient } from "react-query";

import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/ApiClient";

const LoginPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: loginMutation, isLoading: isLoadingLogin } = useMutation(
    apiClient.session.sessionCreate,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        router.push("/");
      },
      onError: (error) => {
        alert("有人帳號密碼打錯了\n這個是系統回報的錯誤訊息：" + error);
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
    <Card sx={{ p: 2, mt: 2, width: "300px" }}>
      <CardContent>
        <Grid
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Grid>
            <Typography variant="h6" component="div">
              登入
            </Typography>
          </Grid>

          <Grid>
            <TextField
              label="帳號"
              variant="outlined"
              value={userName}
              onChange={(event) => {
                setUserName(event.target.value);
              }}
              sx={{ width: "250px" }}
            />
          </Grid>
          <Grid>
            <TextField
              label="密碼"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              sx={{ width: "250px" }}
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

          <Grid>
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

          <Grid>
            <Typography
              variant="caption"
              component={Button}
              onClick={() => {
                router.push("/register");
              }}
              color="secondary"
              noWrap={true}
              sx={{ textDecoration: "none" }}
            >
              沒有帳號嗎？
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
