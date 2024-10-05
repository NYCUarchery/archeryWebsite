"use client";
import { Box, Button } from "@mui/material";
import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "react-query";
import GroupMenu from "../../GroupMenu";
import LanesSetter from "./LanesSetter";
import AdvancingNumSetter from "./AdvancingNumSetter";
import { Competition, Group } from "@/types/oldRef/Competition";
import { apiClient } from "@/utils/ApiClient";
import { Qualification } from "@/types/oldRef/Qualification";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  setStartLane,
  setEndLane,
  setAdvancingNum,
} from "../qualificationScheduleSlice";

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const startLane = useAppSelector(
    (state) => state.qualificationSchedule.startLane
  );
  const endLane = useAppSelector(
    (state) => state.qualificationSchedule.endLane
  );
  const groupIndex = useAppSelector((state) => state.schedule.groupIndex);
  const advancingNum = useAppSelector(
    (state) => state.qualificationSchedule.advancingNum
  );

  const queryClient = useQueryClient();
  const competitionId = parseInt(params.id);
  const competition = (
    queryClient.getQueryData(["competitionWithGroups", competitionId]) as any
  ).data as Competition;
  const { data: group, isSuccess: isGroupSuccess } = useQuery(
    ["groupinfoPlayersDetail", groupIndex],
    () =>
      apiClient.groupInfo.playersDetail(competition?.groups![groupIndex].id),

    {
      staleTime: 60000 * 30,
      select: (data: any) => {
        return data.data as Group;
      },
    }
  );
  const { data: qualification, isSuccess: isQualificationSuccess } = useQuery(
    ["qualificationPlayersDetail", groupIndex],
    () =>
      apiClient.qualification.lanesPlayersDetail(
        competition?.groups![groupIndex].id
      ),
    {
      staleTime: Infinity,
      enabled: isGroupSuccess,
      select: (data: any) => {
        return data.data as Qualification;
      },
    }
  );
  const { mutate: saveSettings } = useMutation(
    () =>
      apiClient.qualification.qualificationUpdate(qualification!.id, {
        start_lane: startLane,
        end_lane: endLane,
        advancing_num: advancingNum,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["qualificationLanes", groupIndex]);
      },
    }
  );
  useEffect(() => {
    if (isQualificationSuccess) {
      dispatch(setStartLane(qualification!.start_lane));
      dispatch(setEndLane(qualification!.end_lane));
      dispatch(setAdvancingNum(qualification!.advancing_num));
    }
  }, [isQualificationSuccess, groupIndex]);

  return (
    <Box sx={{ width: "100%" }}>
      <GroupMenu
        groupNames={competition.groups?.map((group) => group.group_name) ?? []}
      />
      <LanesSetter
        startLane={startLane}
        endLane={endLane}
        lanesNum={competition.lanes_num}
        setStartLane={(value: number) => dispatch(setStartLane(value))}
        setEndLane={(value: number) => dispatch(setEndLane(value))}
      />
      <AdvancingNumSetter playersNum={group ? group.players.length : 0} />

      <Button variant="contained" onClick={() => saveSettings()}>
        儲存
      </Button>
    </Box>
  );
}
