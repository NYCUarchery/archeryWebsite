"use client";

import { Group } from "@/types/oldRef/Competition";
import { Box, Button, Paper } from "@mui/material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import DeleteGroupButton from "./DeleteGroupButton";

const columns = [
  { field: "id", headerName: "選手 ID", width: 90 },
  { field: "name", headerName: "姓名", width: 90 },
];

interface Props {
  competitionId: number;
  groups: Group[];
  groupIndex: number;
}

export default function GroupGrid({
  competitionId,
  groups,
  groupIndex,
}: Props) {
  const queryClient = useQueryClient();
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);
  const [open, setOpen] = useState(false);
  const [targetGroudId, setTargetGroudId] = useState<number>(0);
  const group = groups[groupIndex];
  const { mutate: assignPlayer } = useMutation(
    ({ id, groudId }: { id: number; groudId: number }) =>
      apiClient.player.groupPartialUpdate(id, { group_id: groudId })
  );

  const handleAssign = () => {
    for (let i = 0; i < rowSelectionModel.length; i++) {
      const config =
        i === rowSelectionModel.length - 1
          ? {
              onSuccess: () =>
                queryClient.invalidateQueries([
                  "competitionGroupsPlayersDetail",
                  competitionId,
                ]),
            }
          : {};
      assignPlayer(
        {
          id: rowSelectionModel[i] as number,
          groudId: targetGroudId as number,
        },
        config
      );
    }
    setRowSelectionModel([]);
  };
  const actionButtons = (
    <Box sx={{ ml: "auto" }}>
      <DeleteGroupButton group={group} competitionId={competitionId} />
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        disabled={rowSelectionModel.length === 0}
        sx={{ ml: "10px" }}
      >
        指定組別
      </Button>
    </Box>
  );

  return (
    <>
      <Box sx={{ maxHeight: "480px" }}>
        <Paper sx={{ margin: "20px", padding: "10px" }}>
          {group.group_name === "unassigned" ? "未分組" : group.group_name}
        </Paper>

        <DataGrid
          columns={columns}
          rows={group.players}
          slots={{ toolbar: () => <Toolbar actionButtons={actionButtons} /> }}
          onRowSelectionModelChange={(newRowSelectionModel) => {
            setRowSelectionModel(newRowSelectionModel);
          }}
          rowSelectionModel={rowSelectionModel}
          checkboxSelection
          style={{ height: "100%", width: "300px", margin: "20px" }}
        />
      </Box>
      <Dialog open={open}>
        <DialogTitle>指定組別</DialogTitle>
        <DialogContent>
          <TextField
            select
            sx={{ width: "150px" }}
            value={targetGroudId}
            defaultValue={groups![0].id}
            placeholder="選擇組別"
          >
            {groups ? (
              groups.map((group) => (
                <MenuItem
                  key={group.id}
                  value={group.id}
                  onClick={() => setTargetGroudId(group.id)}
                >
                  {group.group_name === "unassigned"
                    ? "未分組"
                    : group.group_name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value={0}>{"請選擇組別"}</MenuItem>
            )}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              handleAssign();
              setOpen(false);
            }}
          >
            確認
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpen(false);
              setTargetGroudId(groups![0].id);
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
function Toolbar({ actionButtons }: { actionButtons: React.ReactNode }) {
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      {actionButtons}
    </GridToolbarContainer>
  );
}
