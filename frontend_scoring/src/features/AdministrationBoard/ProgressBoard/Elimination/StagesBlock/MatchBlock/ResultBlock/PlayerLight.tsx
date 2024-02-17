import { Avatar } from "@mui/material";

interface Props {
  index: number;
  isConfirmed: boolean;
}

export default function PlayerLight({ isConfirmed, index }: Props) {
  return (
    <Avatar
      sx={{
        width: "25px",
        height: "25px",
        fontSize: "12px",
        backgroundColor: isConfirmed ? "#1bdc1b" : "#dc1b1b",
        color: "white",
      }}
    >
      {index}
    </Avatar>
  );
}
