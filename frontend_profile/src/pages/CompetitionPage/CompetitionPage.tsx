import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { useNavigate } from "react-router-dom";

import { joinCompetition, getCompetitions } from "../../util/api";
import getDate from "date-fns/getDate";
import getMonth from "date-fns/getMonth";
import getYear from "date-fns/getYear";
import getISODay from "date-fns/getISODay";

import { Competition } from "./CompetitionPageComponents/Competition";
import ToCreateButton from "./CompetitionPageComponents/ToCreateButton";

const Day2Mandarin = (day: number) => {
  return ["一", "二", "三", "四", "五", "六", "日"][day - 1];
};

export const TimeView = (date: string) => {
  const fdate = new Date(date);
  const dateString = `${getYear(fdate)}年${getMonth(fdate)}月${getDate(
    fdate
  )}日 （${Day2Mandarin(getISODay(fdate))}）`;
  return <p>{dateString}</p>;
};

// The updated ContestPage component
const ContestPage = () => {
  const navigate = useNavigate();
  var [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getCompetitions();
        setRows(response.data.data);
      } catch (error) {}
    };
    fetchData();
  }, []);

  const handleJoinCompetition = async (competitionId: any) => {
    try {
      const result = await joinCompetition(competitionId);
      if (result.result == "success") {
        window.alert("報名成功");
      } else {
        window.alert("報名失敗");
      }
    } catch (error) {}
  };

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <Grid container justifyContent="center">
            <Grid item>
              <Typography variant="h5" component="div">
                近期比賽
              </Typography>
            </Grid>
          </Grid>
        </Box>
        {rows.map((v, i) => (
          <Competition
            key={i}
            competition={v}
            onJoin={() => handleJoinCompetition(v.id)}
          />
        ))}
        <ToCreateButton />
      </CardContent>
    </Card>
  );
};

export default ContestPage;
