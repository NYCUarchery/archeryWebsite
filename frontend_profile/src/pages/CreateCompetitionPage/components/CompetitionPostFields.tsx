import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { PostCompetitionBody } from "../types/PostCompetitionBody";
import { Signal, signal } from "@preact/signals-react";
import useGetUid from "../../../util/QueryHooks/useGetUid";
import { useNavigate } from "react-router-dom";

let startTime = signal<Dayjs>(dayjs());
let endTime = signal<Dayjs>(dayjs());

type Props = {
  postBody: Signal<PostCompetitionBody>;
};

export default function CompetitionPostFields({ postBody }: Props) {
  postBody.value.start_time = dayjsToISO(startTime.value);
  postBody.value.end_time = dayjsToISO(endTime.value);

  const navigate = useNavigate();

  const { data: uid, isLoading, isError } = useGetUid();
  if (isLoading) return <div>loading...</div>;
  if (isError) navigate("/Login");

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    postBody.value = {
      ...postBody.value,
      [name]: Number(value) ? parseInt(value) : value,
    };
  };

  const handleStartTimeChange = (newValue: Dayjs | null) => {
    if (newValue == null) return;
    startTime.value = newValue;
    postBody.value.start_time = dayjsToISO(newValue);
  };
  const handleEndTimeChange = (newValue: Dayjs | null) => {
    if (newValue == null) return;
    endTime.value = newValue;
    postBody.value.end_time = dayjsToISO(newValue);
  };

  return (
    <>
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box>
          <TextField
            name="host_id"
            label="主辦者UID"
            type="number"
            defaultValue={uid}
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
              label="起始日期"
              value={startTime.value}
              onChange={handleStartTimeChange}
            />
          </LocalizationProvider>
        </Box>
        <Box>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="結束日期"
              value={endTime.value}
              onChange={handleEndTimeChange}
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
    </>
  );
}

const dayjsToISO = (dayjs: Dayjs) => {
  return dayjs.format("YYYY-MM-DDTHH:mm:ss") + "+00:00";
};
