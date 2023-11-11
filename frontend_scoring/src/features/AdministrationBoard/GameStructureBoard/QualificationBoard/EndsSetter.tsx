import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setQualificationEndsNum } from "../../../States/gameSlice";

export default function EndsSetter() {
  const endsNum = useSelector(
    (state: any) => state.game.qualification.ends_num
  );
  const dispatch = useDispatch();
  const marks = [
    { value: 1, label: "1波" },
    { value: 6, label: "6波每局" },
  ];

  return (
    <div>
      <Slider
        defaultValue={endsNum}
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={6}
        value={endsNum}
        sx={{ marginLeft: "30px", width: "200px" }}
        onChange={(_event, newValue) => {
          dispatch(setQualificationEndsNum(newValue as number));
        }}
      />
    </div>
  );
}
