import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setQualificationArrowsNumPerEnd } from "../../../States/gameSlice";

export default function ArrowsPerEndsSetter() {
  const arrowsNumPerEnds = useSelector(
    (state: any) => state.game.qualification.arrows_num_per_end
  );
  const dispatch = useDispatch();
  const marks = [
    { value: 1, label: "1支" },
    { value: 6, label: "6支每波" },
  ];

  return (
    <div>
      <Slider
        defaultValue={arrowsNumPerEnds}
        aria-label="Arrows per ends"
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={6}
        value={arrowsNumPerEnds}
        sx={{ marginLeft: "30px", width: "200px" }}
        onChange={(_event, newValue) => {
          dispatch(setQualificationArrowsNumPerEnd(newValue as number));
        }}
      />
    </div>
  );
}
