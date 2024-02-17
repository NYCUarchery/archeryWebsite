import { useSelector } from "react-redux";
import { useQueryClient } from "react-query";
import { initialize } from "./qualificationStructureSetterSlice";
import useGetQualificationWithLanesPlayers from "../../../../../QueryHooks/useGetQualificationWithLanesPlayers";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { Box, Button } from "@mui/material";
import LanesSetter from "./LanesSetter";
import AdvancingNumSetter from "./AdvancingNumSetter";
import { useMutation } from "react-query";
import axios from "axios";

const putQualification = (qualification: any) => {
  return axios.put(
    `/api/qualification/whole/${qualification.id}`,
    qualification
  );
};

export default function QualificationStructureSetter() {
  const queryClient = useQueryClient();
  const startLane = useSelector(
    (state: any) => state.qualificationStructureSetter.startLane
  );
  const endLane = useSelector(
    (state: any) => state.qualificationStructureSetter.endLane
  );
  const advancingNum = useSelector(
    (state: any) => state.qualificationStructureSetter.advancingNum
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const dispatch = useDispatch();
  const {
    data: qualification,
    isLoading: isLoading,
    isSuccess,
  } = useGetQualificationWithLanesPlayers(groupShown);
  const { mutate } = useMutation(putQualification, {
    onSuccess: () => {
      queryClient.invalidateQueries("qualificationWithLanesPlayers");
      queryClient.invalidateQueries("lanes");
    },
  });

  useEffect(() => {
    if (qualification === undefined) return;
    dispatch(
      initialize({
        startLane: qualification.start_lane,
        endLane: qualification.end_lane,
        advancingNum: qualification.advancing_num,
      })
    );
  }, [qualification, isSuccess]);

  if (isLoading) {
    return <></>;
  }

  const handleClick = () => {
    if (qualification === undefined) return;
    mutate({
      id: qualification.id,
      start_lane: startLane,
      end_lane: endLane,
      advancing_num: advancingNum,
    });
  };

  return (
    <Box>
      <LanesSetter></LanesSetter>
      <AdvancingNumSetter></AdvancingNumSetter>
      <Button onClick={handleClick}>儲存</Button>
    </Box>
  );
}
