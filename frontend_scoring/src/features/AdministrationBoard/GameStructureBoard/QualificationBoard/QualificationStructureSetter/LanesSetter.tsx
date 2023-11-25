import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import useGetCompetition from "../../../../../QueryHooks/useGetCompetition";
import { setStartLane, setEndLane } from "./qualificationStructureSetterSlice";

export default function LanesSetter() {
  const startLane = useSelector(
    (state: any) => state.qualificationStructureSetter.startLane
  );
  const endLane = useSelector(
    (state: any) => state.qualificationStructureSetter.endLane
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition, isLoading: isLoadingCompetition } =
    useGetCompetition(competitionID);
  const dispatch = useDispatch();

  if (isLoadingCompetition) {
    return <></>;
  }
  const lanesNum = competition?.lanes_num;

  const marks = [
    { value: 1, label: "1號靶道" },
    { value: lanesNum, label: lanesNum + "號靶道" },
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
          dispatch(setStartLane(newValue[0]));
          dispatch(setEndLane(newValue[1]));
        }}
      />
    </div>
  );
}
