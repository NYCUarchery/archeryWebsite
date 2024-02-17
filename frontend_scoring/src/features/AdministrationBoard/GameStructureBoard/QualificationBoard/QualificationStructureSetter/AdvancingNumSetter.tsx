import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import useGetGroupsWithPlayers from "../../../../../QueryHooks/useGetGroupsWithPlayers";
import { setAdvancingNum } from "./qualificationStructureSetterSlice";
import { Group } from "../../../../../QueryHooks/types/Competition";

export default function AdvancingNumSetter() {
  const dispatch = useDispatch();
  const advancingNum = useSelector(
    (state: any) => state.qualificationStructureSetter.advancingNum
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups } = useGetGroupsWithPlayers(competitionID);

  if (!groups) {
    return <></>;
  }

  const group = groups.find((e: any) => e.id == groupShown) as Group;

  const marks = [
    { value: 1, label: "1人晉級" },
    { value: group.players.length, label: group.players.length + "人晉級" },
  ];

  return (
    <div>
      <Slider
        defaultValue={advancingNum}
        valueLabelDisplay="auto"
        step={1}
        marks={marks}
        min={1}
        max={group.players.length}
        value={advancingNum}
        sx={{ marginLeft: "30px", width: "200px" }}
        onChange={(_event, newValue) => {
          dispatch(setAdvancingNum(newValue as number));
        }}
      />
    </div>
  );
}
