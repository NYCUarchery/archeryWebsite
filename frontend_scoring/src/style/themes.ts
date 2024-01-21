import { createTheme } from "@mui/material";

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
  }
);
