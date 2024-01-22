import { createTheme } from "@mui/material";

//下面看起來多餘的大括號是為了讓編譯器不要報錯，其實沒有它也可以正常編譯，原理可以參閱https://mui.com/material-ui/customization/theming中有關TS的部分。
export const scoringTheme = createTheme(
  {},
  {
    palette: {
      primary: {
        main: "#2056CC",
      },
      secondary: {
        main: "#4020cc",
      },
      black_score: {
        main: "#000000",
        light: "#000000",
        dark: "#000000",
        contrastText: "#ffffff",
      },
      white_score: {
        main: "#ffffff",
        light: "#ffffff",
        dark: "#ffffff",
        contrastText: "#000000",
      },
      blue_score: {
        main: "#04aaea",
        light: "#04aaea",
        dark: "#04aaea",
        contrastText: "#ffffff",
      },
      yellow_score: {
        main: "#f5ed04",
        light: "#f5ed04",
        dark: "#f5ed04",
        contrastText: "#000000",
      },
      red_score: {
        main: "#dc262c",
        light: "#dc262c",
        dark: "#dc262c",
        contrastText: "#ffffff",
      },
    },
    components: {
      MuiButtonGroup: {
        styleOverrides: {
          grouped: {
            border: "none",
          },
        },
      },
    },
  }
);
