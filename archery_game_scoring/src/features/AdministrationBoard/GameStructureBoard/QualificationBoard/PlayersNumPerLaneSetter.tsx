import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setQualificationPlayersNumPerLane } from "../../../States/gameSlice";

export default function PlayersNumPerLaneSetter() {
  const groupShown = useSelector(
    (state: any) => state.qualificationStructureGroupMenu.groupShown
  );
  const playersNumPerlane = useSelector(
    (state: any) =>
      state.game.qualification.groups[groupShown].players_num_per_lane
  );
  const dispatch = useDispatch();
  const marks = [
    { value: 1, label: "1個人" },
    { value: 8, label: "8個人一道" },
  ];

  return (
    <div>
      <Slider
        defaultValue={playersNumPerlane}
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={8}
        value={playersNumPerlane}
        sx={{ marginLeft: "30px", width: "200px" }}
        onChange={(_event, newValue: any) => {
          dispatch(
            setQualificationPlayersNumPerLane({
              groupId: groupShown,
              playersNumPerlane: newValue as number,
            })
          );
        }}
      />
    </div>
  );
}
