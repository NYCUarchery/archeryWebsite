import React from "react";
import { TextField, Box } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { PostCompetitionBody } from "../types/PostCompetitionBody";
import { Signal, signal } from "@preact/signals-react";

let date = signal<Dayjs>(dayjs());

type Props = {
  postBody: Signal<PostCompetitionBody>;
};

export default function CompetitionPostFields({ postBody }: Props) {
  postBody.value.date = dayjsToISO(date.value);

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log(postBody.value);
    postBody.value = { ...postBody.value, [name]: value };
  };

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue == null) return;
    date.value = newValue;
    postBody.value.date = dayjsToISO(newValue);
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box>
        <TextField
          name="host_id"
          label="主辦者UID"
          value={postBody.value.host_id}
          onChange={handleFieldChange}
        />
      </Box>
      <Box>
        <TextField
          name="title"
          label="比賽名稱"
          value={postBody.value.title}
          onChange={handleFieldChange}
        />
      </Box>
      <Box>
        <TextField
          name="sub_title"
          label="比賽副標題"
          value={postBody.value.sub_title}
          onChange={handleFieldChange}
        />
      </Box>
      <Box>
        <TextField
          name="rounds_num"
          label="局數"
          type="number"
          value={postBody.value.rounds_num}
          onChange={handleFieldChange}
        />
      </Box>
      <Box>
        <TextField
          name="lanes_num"
          label="靶道數量"
          type="number"
          value={postBody.value.lanes_num}
          onChange={handleFieldChange}
        />
      </Box>
      <Box>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="日期"
            value={date.value}
            onChange={handleDateChange}
          />
        </LocalizationProvider>
      </Box>
      <Box>
        <TextField
          name="script"
          label="簡介"
          value={postBody.value.script}
          onChange={handleFieldChange}
          multiline // Enable multiline
          rows={4} // Set the number of rows
          sx={{ width: "100%", height: "120px" }} // Increase the height
        />
      </Box>
    </Box>
  );
}

const dayjsToISO = (dayjs: Dayjs) => {
  return dayjs.format("YYYY-MM-DDTHH:mm:ss") + "." + dayjs.format("SSS") + "Z";
};
