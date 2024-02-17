import MainBoard from "./MainBoard/MainBoard";
import ScoreEditionBoard from "./ScoreEditionBoard/ScoreEditionBoard";
import ParticipantsBoard from "./ParticipantsBoard/ParticitpantsBoard";
import GroupsBoard from "./GroupsBoard/GroupsBoard";
import GameStructureBoard from "./GameStructureBoard/GameStructureBoard";
import ProgressBoard from "./ProgressBoard/ProgressBoard";

import { TabList, TabPanel, TabContext } from "@mui/lab";
import { Tab } from "@mui/material";

import { useState } from "react";

export default function AdministrationBoard() {
  const [tabValue, setTabValue] = useState("1");

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <TabContext value={tabValue}>
      <TabList
        onChange={handleTabChange}
        centered
        aria-label="Administration board"
      >
        <Tab label="主面板" value={"1"} />
        <Tab label="參加者管理" value={"2"} />
        <Tab label="組別管理" value={"3"} />
        <Tab label="比賽結構" value={"4"} />
        <Tab label="進度" value={"5"} />
        <Tab label="分數編輯" value={"6"} />
      </TabList>
      <TabPanel value="1">
        <MainBoard />
      </TabPanel>
      <TabPanel value="2">
        <ParticipantsBoard />
      </TabPanel>
      <TabPanel value="3">
        <GroupsBoard />
      </TabPanel>
      <TabPanel value="4">
        <GameStructureBoard />
      </TabPanel>
      <TabPanel value="5">
        <ProgressBoard />
      </TabPanel>
      <TabPanel value="6">
        <ScoreEditionBoard />
      </TabPanel>
    </TabContext>
  );
}
