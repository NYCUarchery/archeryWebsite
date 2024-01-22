import { useTheme } from "@mui/material";

export const useScoreColor = (score: number) => {
  const palette: any = useTheme().palette;
  let backgroundColor: string = "";
  let textColor: string = "";

  switch (score) {
    case 0:
      backgroundColor = palette.black_score.main;
      textColor = palette.black_score.contrastText;
      break;
    case 1:
      backgroundColor = palette.white_score.main;
      textColor = palette.white_score.contrastText;
      break;
    case 2:
      backgroundColor = palette.white_score.main;
      textColor = palette.white_score.contrastText;
      break;
    case 3:
      backgroundColor = palette.black_score.main;
      textColor = palette.black_score.contrastText;
      break;
    case 4:
      backgroundColor = palette.black_score.main;
      textColor = palette.black_score.contrastText;
      break;
    case 5:
      backgroundColor = palette.blue_score.main;
      textColor = palette.blue_score.contrastText;
      break;
    case 6:
      backgroundColor = palette.blue_score.main;
      textColor = palette.blue_score.contrastText;
      break;

    case 7:
      backgroundColor = palette.red_score.main;
      textColor = palette.red_score.contrastText;
      break;

    case 8:
      backgroundColor = palette.red_score.main;
      textColor = palette.red_score.contrastText;
      break;

    case 9:
      backgroundColor = palette.yellow_score.main;
      textColor = palette.yellow_score.contrastText;
      break;

    case 10:
      backgroundColor = palette.yellow_score.main;
      textColor = palette.yellow_score.contrastText;
      break;

    case 11:
      backgroundColor = palette.yellow_score.main;
      textColor = palette.yellow_score.contrastText;
      break;
    default:
      backgroundColor = palette.black_score.main;
      textColor = palette.black_score.contrastText;
  }

  return { backgroundColor, textColor };
};
