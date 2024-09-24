import { Button, Snackbar, Alert } from "@mui/material";
import { useMutation } from "react-query";
import { useState } from "react";
import { useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { Group } from "@/types/oldRef/Competition";

interface Props {
  group: Group;
  competitionId: number;
}

export default function DeleteGroupButton({ group, competitionId }: Props) {
  const queryClient = useQueryClient();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { mutate } = useMutation(apiClient.groupInfo.groupinfoDelete, {
    onSuccess: () => {
      queryClient.invalidateQueries([
        "competitionGroupsPlayersDetail",
        competitionId,
      ]);
      setSnackbarOpen(true);
    },
  });

  return (
    <>
      <Button
        color="error"
        variant="contained"
        onClick={() => {
          if (group.players.length !== 0) {
            alert("只能刪空組別");
            return;
          }
          mutate(group.id.toString());
          setSnackbarOpen(true);
        }}
      >
        刪除
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
