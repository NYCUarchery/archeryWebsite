import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";
import useGetPlayerSets from "../../../../../../QueryHooks/useGetPlayerSets";

const postMatch = ({ stageID, lanes, IDs }: any) => {
  console.log(lanes);
  const data = {
    stage_id: stageID,
    player_set_ids: IDs,
    lane_numbers: lanes,
  };
  return axios.post(`/api/elimination/match`, data);
};

interface Props {
  stage: any;
}
export default function MatchAddButton({ stage }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setsnackbarOpen] = useState(false);
  const [lanes, setLanes] = useState([] as number[]);
  const [IDs, setIDs] = useState([] as number[]);
  const { data: playerSets, isLoading } = useGetPlayerSets(
    stage.elimination_id
  );
  const { mutate } = useMutation(postMatch, {
    onSuccess: () => {
      queryClient.invalidateQueries("eliminationWithScores");
      setsnackbarOpen(true);
    },
  });
  if (isLoading) {
    return <></>;
  }

  const playerSetsOptions = playerSets.map((s: any) => {
    return {
      label: s.set_name + "rank: " + s.rank,
      value: s.id,
    };
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={handleClickOpen}>創建對局</Button>
      <Snackbar
        open={snackbarOpen}
        onClose={() => setsnackbarOpen(false)}
        autoHideDuration={6000}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          對局創建成功喔~~~
        </Alert>
      </Snackbar>
      <Dialog open={open} onClose={handleClose} sx={{ maxWidth: "500px" }}>
        <DialogTitle>創建對局</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            label={"組一靶道號碼"}
            margin="normal"
            onChange={(event) => {
              let newLanes: number[] = lanes;
              newLanes[0] = Number(event.target.value);
              setLanes(newLanes);
            }}
          />
          <TextField
            fullWidth
            required
            select
            label={"第一組"}
            margin="normal"
            onChange={(event) => {
              let newIDs = IDs;
              newIDs[0] = Number(event.target.value);
              setIDs(newIDs);
            }}
          >
            {playerSetsOptions.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            required
            label={"組二靶道號碼"}
            margin="normal"
            onChange={(event) => {
              let newLanes = lanes;
              newLanes[1] = Number(event.target.value);
              setLanes(newLanes);
            }}
          />
          <TextField
            fullWidth
            required
            select
            label={"第二組"}
            margin="normal"
            onChange={(event) => {
              let newIDs = IDs;
              newIDs[1] = Number(event.target.value);
              setIDs(newIDs);
            }}
          >
            {playerSetsOptions.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              console.log(lanes);
              mutate({
                stageID: stage.id,
                lanes: lanes,
                IDs: IDs,
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
