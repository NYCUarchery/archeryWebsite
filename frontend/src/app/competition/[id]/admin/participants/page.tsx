"use client";
import { Box, Button } from "@mui/material";
import { apiClient } from "@/utils/ApiClient";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Participant } from "@/types/oldRef/Participant";
import {
  DataGrid,
  GridRowSelectionModel,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { useState } from "react";

const columns = [
  { field: "id", headerName: "人員 ID", width: 90 },
  { field: "name", headerName: "姓名", width: 150 },
  { field: "role", headerName: "身分", width: 150 },
  { field: "status", headerName: "狀態", width: 150 },
];

export default function Page({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const { data: participants } = useQuery(
    ["participantCompetitionList", params.id],
    () => apiClient.participant.participantCompetitionList(parseInt(params.id)),
    {
      select: (data) => data.data as unknown as Participant[],
      staleTime: Infinity,
    }
  );
  const { mutate: approveParticipant } = useMutation((id: number) =>
    apiClient.participant.participantWholeUpdate(id, {
      status: "approved",
    })
  );
  const { mutate: deleteParticipant } = useMutation((id: number) =>
    apiClient.participant.participantDelete(id)
  );

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);

  const handleApprove = () => {
    for (let i = 0; i < rowSelectionModel.length; i++) {
      const config =
        i === rowSelectionModel.length - 1
          ? {
              onSuccess: () =>
                queryClient.invalidateQueries([
                  "participantCompetitionList",
                  params.id,
                ]),
            }
          : {};
      approveParticipant(rowSelectionModel[i] as number, config);
    }
    setRowSelectionModel([]);
  };

  const handleDelete = () => {
    for (let i = 0; i < rowSelectionModel.length; i++) {
      const config =
        i === rowSelectionModel.length - 1
          ? {
              onSuccess: () =>
                queryClient.invalidateQueries([
                  "participantCompetitionList",
                  params.id,
                ]),
            }
          : {};
      setRowSelectionModel([]);
      deleteParticipant(rowSelectionModel[i] as number, config);
    }
  };

  const actionButtons = (
    <Box sx={{ ml: "auto" }}>
      <Button color="success" variant="contained" onClick={handleApprove}>
        核准
      </Button>
      <Button
        color="error"
        variant="contained"
        onClick={handleDelete}
        sx={{ ml: 2 }}
      >
        刪除
      </Button>
    </Box>
  );
  return (
    <Box>
      <DataGrid
        columns={columns}
        rows={participants}
        slots={{ toolbar: () => <Toolbar actionButtons={actionButtons} /> }}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
        checkboxSelection
      />
    </Box>
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
