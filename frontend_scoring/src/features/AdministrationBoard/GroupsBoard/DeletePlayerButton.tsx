import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  DialogContentText,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";
import { useState } from "react";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";

const deletePlayer = (playerID: number) => {
  return axios.delete(`/api/player/${playerID}`);
};

export default function DeletePlayerButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setsnackbarOpen] = useState(false);
  const [id, setId] = useState("");
  const { mutate } = useMutation(deletePlayer, {
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
      <Button onClick={handleClickOpen} color="error">
        玩家刪除
      </Button>
      <Snackbar
        open={snackbarOpen}
        onClose={() => setsnackbarOpen(false)}
        autoHideDuration={6000}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          玩家刪除成功喔 uwu
        </Alert>
      </Snackbar>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>刪除玩家</DialogTitle>
        <DialogContent>
          <DialogContentText>請輸入要刪除的玩家的ID</DialogContentText>
          <TextField
            required
            label="玩家ID"
            onChange={(event) => setId(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              mutate(Number(id));
              handleClose();
            }}
          >
            確認
          </Button>
          <Button onClick={handleClose}>取消</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
