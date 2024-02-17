import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";

const bowTypes = [
  {
    value: "反曲弓",
    label: "反曲弓",
  },
  {
    value: "複合弓",
    label: "複合弓",
  },
];

const postGroup = ({ competitionID, groupName, range, bowType }: any) => {
  const group = {
    competition_id: Number(competitionID),
    group_name: groupName,
    group_range: range,
    bow_type: bowType,
  };
  return axios.post("/api/groupinfo", group);
};

export default function GroupCreator() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setsnackbarOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [range, setRange] = useState("");
  const [bowType, setBowType] = useState("");
  const { mutate } = useMutation(postGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries("groupsWithPlayers");
      setsnackbarOpen(true);
    },
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={handleClickOpen}>創建組別</Button>
      <Snackbar
        open={snackbarOpen}
        onClose={() => setsnackbarOpen(false)}
        autoHideDuration={6000}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          組別創建成功喔~~~
        </Alert>
      </Snackbar>
      <Dialog open={open} onClose={handleClose} sx={{ maxWidth: "500px" }}>
        <DialogTitle>創建組別</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            label={"組別名稱"}
            margin="normal"
            onChange={(event) => setGroupName(event.target.value)}
          />
          <TextField
            fullWidth
            required
            label={"距離"}
            margin="normal"
            onChange={(event) => setRange(event.target.value + "m")}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
          <TextField
            fullWidth
            required
            select
            label={"弓種"}
            margin="normal"
            onChange={(event) => setBowType(event.target.value)}
          >
            {bowTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              mutate({
                competitionID: competitionID,
                groupName: groupName,
                range: range,
                bowType: bowType,
              });
              handleClose();
            }}
          >
            創建
          </Button>
          <Button onClick={handleClose}>取消</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
