import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setQualificationRoundsNum } from "../../../States/gameSlice";

export default function RoundSetter() {
  const roundsNum = useSelector(
    (state: any) => state.game.qualification.rounds_num
  );
  const dispatch = useDispatch();
  const marks = [
    { value: 1, label: "1局" },
    { value: 6, label: "6局" },
  ];

  return (
    <div>
      <Slider
        defaultValue={roundsNum}
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={6}
        value={roundsNum}
        sx={{ marginLeft: "30px", width: "200px" }}
        onChange={(_event, newValue) => {
          dispatch(setQualificationRoundsNum(newValue as number));
        }}
      />
    </div>
  );
}
