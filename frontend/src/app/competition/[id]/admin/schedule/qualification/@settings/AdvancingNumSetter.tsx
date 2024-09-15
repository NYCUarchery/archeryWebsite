import { Slider } from "@mui/material";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { setAdvancingNum } from "../qualificationScheduleSlice";

interface Props {
  playersNum: number;
}

export default function AdvancingNumSetter({ playersNum }: Props) {
  const dispatch = useAppDispatch();
  const advancingNum = useAppSelector(
    (state) => state.qualificationSchedule.advancingNum
  );
  const marks = [
    { value: 1, label: "1人晉級" },
    { value: playersNum, label: playersNum + "人晉級" },
  ];

  return (
    <div>
      <Slider
        defaultValue={advancingNum}
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={playersNum}
        value={advancingNum}
        sx={{ maxWidth: "100%" }}
        onChange={(_event, newValue) => {
          dispatch(setAdvancingNum(newValue as number));
        }}
      />
    </div>
  );
}
