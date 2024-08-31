"use client";
import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useState } from "react";
import { useMutation } from "react-query";
import { Button } from "@mui/material";
import { Signal } from "@preact/signals-react";
import { apiClient } from "@/utils/ApiClient";
import { useRouter } from "next/navigation";
import { PostCompetitionBody } from "./types/PostCompetitionBody";

type Props = {
  postBody: Signal<PostCompetitionBody>;
};

const CreateButton: React.FC<Props> = ({ postBody }: Props) => {
  const [isCreationSuccess, setIsCreationSuccess] = useState(false);
  const [isCreationError, setIsCreationError] = useState(false);
  const router = useRouter();
  const { mutate: createCompetition } = useMutation(
    apiClient.competition.competitionCreate,
    {
      onSuccess: () => {
        setIsCreationSuccess(true);
      },
      onError: () => {
        setIsCreationError(true);
      },
    }
  );

  const handleClick = () => {
    createCompetition(postBody.value as any);
  };

  return (
    <>
      <Snackbar
        open={isCreationSuccess}
        onClose={() => {
          setIsCreationSuccess(false);
          router.push("/recent_competitions");
        }}
        autoHideDuration={3000}
        key={"bottomcenter"}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          創建比賽成功
        </Alert>
      </Snackbar>
      <Snackbar
        open={isCreationError}
        onClose={() => setIsCreationError(false)}
        autoHideDuration={6000}
        key={"bottomcenter"}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          創建比賽失敗
        </Alert>
      </Snackbar>
      <Button variant="contained" color="primary" onClick={handleClick}>
        創建比賽
      </Button>
    </>
  );
};

export default CreateButton;
