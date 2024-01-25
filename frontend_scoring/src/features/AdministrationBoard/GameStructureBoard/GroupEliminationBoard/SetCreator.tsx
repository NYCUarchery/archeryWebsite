import {
  Button,
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  DialogActions,
} from "@mui/material";
import useGetGroupsWithPlayers from "../../../../QueryHooks/useGetGroupsWithPlayers";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Player } from "../../../../QueryHooks/types/Player";

const postPlayerSet = ({ eliminationID, name, playerIDs }: any) => {
  const body = {
    elimination_id: eliminationID,
    set_name: name,
    player_ids: playerIDs,
  };
  return axios.post(`/api/playerset/`, body);
};

interface Props {
  eliminationID: number;
  teamSize: number;
}

export default function SetCreator({ eliminationID, teamSize }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const groupID = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const { data: groups } = useGetGroupsWithPlayers(competitionID);
  const { mutate: createPlayerSet } = useMutation(postPlayerSet, {
    onSuccess: () => {
      queryClient.invalidateQueries(["playerSets", eliminationID]);
    },
  });

  const [fieldValues, setFieldValues] = useState([] as number[]);

  if (!groups) return <></>;
  const players = groups.find((g: any) => g.id === groupID)
    ?.players as Player[];

  let sets = [];
  for (let i = 0; i < players.length; i++) {
    const set = {
      label: players[i].name + " PID: " + players[i].id,
      value: players[i].id,
    };
    sets.push(set);
  }

  let fields = [];
  for (let i = 0; i < teamSize; i++) {
    const field = (
      <TextField
        fullWidth
        required
        select
        label={"第" + (i + 1) + "位隊員"}
        margin="normal"
        onChange={(event) => {
          let newValues = fieldValues;
          newValues[i] = Number(event.target.value);
          setFieldValues(newValues);
        }}
      >
        {sets.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );

    fields.push(field);
  }

  const handleClick = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleCreate = () => {
    createPlayerSet({
      eliminationID: eliminationID,
      name: name,
      playerIDs: fieldValues,
    });
    handleClose();
  };
  const handleCancel = () => {
    handleClose();
  };
  return (
    <>
      <Button onClick={handleClick}>創建組別</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <TextField
            fullWidth
            required
            label={"名稱"}
            margin="normal"
            onChange={(event) => setName(event.target.value)}
          />
          {fields}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreate}>創建</Button>
          <Button onClick={handleCancel}>取消</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
