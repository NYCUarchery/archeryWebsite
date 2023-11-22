import { Slider } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import useGetGroupsWithPlayers from "../../../../../QueryHooks/useGetGroupsWithPlayers";
import { setAdvancingNum } from "./qualificationStructureSetterSlice";

export default function AdvancingNumSetter() {
  const dispatch = useDispatch();
  const advancingNum = useSelector(
    (state: any) => state.qualificationStructureSetter.advancingNum
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups, isLoading: isLoadingGroups } =
    useGetGroupsWithPlayers(competitionID);

  if (isLoadingGroups) {
    return <></>;
  }

  const group = groups.find((e: any) => e.id == groupShown);

  const marks = [
    { value: 1, label: "1名" },
    { value: group.players.length, label: group.players.length + "名" },
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
