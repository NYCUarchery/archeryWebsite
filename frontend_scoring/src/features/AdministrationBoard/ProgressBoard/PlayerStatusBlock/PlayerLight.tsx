import { Avatar } from "@mui/material";

interface Props {
  laneIndex: number;
  order: number;
  isConfirmed: boolean;
}

export default function PlayerLight({ laneIndex, order, isConfirmed }: Props) {
  let playerCode = laneIndex.toString();

  playerCode += String.fromCharCode("A".charCodeAt(0) + order);

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
      {playerCode}
    </Avatar>
  );
}
