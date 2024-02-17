import { Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";

import { useState } from "react";
import QualificationPenal from "./Qualification/QualificationPenal";

export default function ScoreEditionBoard() {
  const [tabValue, setTabValue] = useState("1");

  return (
    <TabContext value={tabValue}>
      <TabList onChange={(_e, newValue) => setTabValue(newValue)} centered>
        <Tab label="資格賽" value="1" />
      </TabList>
      <TabPanel value="1">
        <QualificationPenal />
      </TabPanel>
    </TabContext>
  );
}
