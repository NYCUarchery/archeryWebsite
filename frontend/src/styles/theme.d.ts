declare module "@mui/material/styles" {
  interface Palette {
    black_score?: Palette;
    white_score?: Palette;
    blue_score?: Palette;
    yellow_score?: Palette;
    red_score?: Palette;
  }
  interface PaletteOptions {
    black_score?: PaletteOptions;
    white_score?: PaletteOptions;
    blue_score?: PaletteOptions;
    yellow_score?: PaletteOptions;
    red_score?: PaletteOptions;
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
