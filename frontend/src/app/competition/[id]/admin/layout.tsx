"use client";
import { TabList, TabPanel, TabContext } from "@mui/lab";
import { Tab } from "@mui/material";

import { useState } from "react";

export default function Layout({
  main,
  participants,
  groups,
  schedule,
  progress,
  score_edition,
}: {
  main: JSX.Element;
  participants: JSX.Element;
  groups: JSX.Element;
  schedule: JSX.Element;
  progress: JSX.Element;
  score_edition: JSX.Element;
}) {
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
        <Tab label="賽程" value={"4"} />
        <Tab label="進度" value={"5"} />
        <Tab label="分數編輯" value={"6"} />
      </TabList>
      <TabPanel value="1">{main}</TabPanel>
      <TabPanel value="2">{participants}</TabPanel>
      <TabPanel value="3">{groups}</TabPanel>
      <TabPanel value="4">{schedule}</TabPanel>
      <TabPanel value="5">{progress}</TabPanel>
      <TabPanel value="6">{score_edition}</TabPanel>
    </TabContext>
  );
}
