import Box from "@mui/material/Box";

interface Props {
  backgroundColor: string;
  diameter: number;
  text: string;
  color?: string;
  fontSize?: number;
  onClick?: any;
  sx?: any;
}

export default function CircleSign({
  backgroundColor,
  diameter,
  text,
  fontSize,
  color = "white",
  onClick,
  sx,
}: Props) {
  return (
    <Box
      sx={{
        width: diameter,
        height: diameter,
        borderRadius: "50%",
        backgroundColor: backgroundColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: color,
        fontSize: fontSize ? fontSize : diameter / 2,
        textAlign: "center",
        lineHeight: diameter,
        ...sx,
      }}
      onClick={onClick}
    >
      {text}
    </Box>
  );
}
