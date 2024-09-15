import { Slider } from "@mui/material";

interface Props {
  startLane: number;
  endLane: number;
  lanesNum: number;
  setStartLane: (value: number) => void;
  setEndLane: (value: number) => void;
}

export default function LanesSetter({
  startLane,
  endLane,
  lanesNum,
  setStartLane,
  setEndLane,
}: Props) {
  const marks = [
    { value: 1, label: "1號靶道" },
    { value: lanesNum as number, label: lanesNum + "號靶道" },
  ];

  return (
    <div>
      <Slider
        defaultValue={[startLane, endLane]}
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={lanesNum}
        value={[startLane, endLane]}
        sx={{ maxWidth: "100%" }}
        onChange={(_event, newValue: any) => {
          setStartLane(newValue[0]);
          setEndLane(newValue[1]);
        }}
      />
    </div>
  );
}
