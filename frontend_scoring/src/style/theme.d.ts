declare module "@mui/material/styles" {
  interface Palette {
    black_score: Palette["primary"];
    white_score: Palette["primary"];
    blue_score: Palette["primary"];
    yellow_score: Palette["primary"];
    red_score: Palette["primary"];
  }
  interface PaletteOptions {
    black_score?: PaletteOptions["primary"];
    white_score?: PaletteOptions["primary"];
    blue_score?: PaletteOptions["primary"];
    yellow_score?: PaletteOptions["primary"];
    red_score?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    black_score: true;
    white_score: true;
    blue_score: true;
    yellow_score: true;
    red_score: true;
  }
}
