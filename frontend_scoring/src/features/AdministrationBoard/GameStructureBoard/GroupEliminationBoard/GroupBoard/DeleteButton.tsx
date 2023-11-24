import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { useState } from "react";

interface Props {
  setID: number;
  eliminationID: number;
}

const deleteSet = (setID: number) => {
  return axios.delete(`/api/playerset/${setID}`);
};

export default function DeleteButton({ setID, eliminationID }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: removeSet } = useMutation(deleteSet, {
    onSuccess: () => {
      queryClient.invalidateQueries(["playerSetWithPlayers", setID]);
      queryClient.invalidateQueries(["playerSets", eliminationID]);
    },
  });

  const handleOnClick = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = () => {
    removeSet(setID);
    handleClose();
  };
  const handleCancel = () => {
    handleClose();
  };

  return (
    <>
      <Button color="error" onClick={handleOnClick}>
        刪除隊伍
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <DialogContentText>ARE YOU SURE ABOUT THAT?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDelete}>Sure</Button>
          <Button onClick={handleCancel}>先不要</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
