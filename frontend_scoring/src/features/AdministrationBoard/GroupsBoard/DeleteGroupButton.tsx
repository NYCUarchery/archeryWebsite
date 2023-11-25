import { Button, Snackbar, Alert } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useQueryClient } from "react-query";
import useGetGroupsWithPlayers from "../../../QueryHooks/useGetGroupsWithPlayers";

const deleteGroup = (groupID: number) => {
  return axios.delete(`/api/groupinfo/${groupID}`);
};

export default function deleteButton() {
  const queryClient = useQueryClient();
  const competitionID = useSelector((state: any) => state.game.competitionID);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { mutate } = useMutation(deleteGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries("groupsWithPlayers");
      setSnackbarOpen(true);
    },
  });
  const selectedGroupID = useSelector(
    (state: any) => state.groupSelector.selectedGroupID
  );
  const { data: groups } = useGetGroupsWithPlayers(competitionID);
  if (selectedGroupID === null) {
    return <Button color="error">選組以刪除</Button>;
  }

  if (
    selectedGroupID ===
    queryClient.getQueryData<any>("groupsWithPlayers")?.data.groups[0].id
  ) {
    return <Button color="error">這可不行刪</Button>;
  }
  console.log(groups);
  if (
    groups?.find((group: any) => group.id === selectedGroupID)?.players
      .length !== 0
  ) {
    return <Button color="error">只能刪空組別</Button>;
  }

  return (
    <>
      <Button
        color="error"
        onClick={() => {
          mutate(selectedGroupID);
          setSnackbarOpen(true);
        }}
      >
        刪除所選組別
      </Button>

      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={6000}
      >
        <Alert severity="success">組別刪除成功 uwu</Alert>
      </Snackbar>
    </>
  );
}
