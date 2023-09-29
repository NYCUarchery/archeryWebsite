import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setQualificationLanes } from "../../../States/gameSlice";

export default function LanesSetter() {
  const groupShown = useSelector(
    (state: any) => state.qualificationStructureGroupMenu.groupShown
  );
  const lanesNum: number = useSelector((state: any) => state.game.lanesNum);
  const startLane = useSelector(
    (state: any) => state.game.qualification.groups[groupShown].start_lane
  );
  const endLane = useSelector(
    (state: any) => state.game.qualification.groups[groupShown].end_lane
  );
  const dispatch = useDispatch();
  const marks = [
    { value: 1, label: "1號把道" },
    { value: lanesNum, label: lanesNum + "號把道" },
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
        sx={{ marginLeft: "30px", width: "200px" }}
        onChange={(_event, newValue: any) => {
          dispatch(
            setQualificationLanes({
              groupId: groupShown,
              startLane: newValue[0] as number,
              endLane: newValue[1] as number,
            })
          );
        }}
      />
    </div>
  );
}
