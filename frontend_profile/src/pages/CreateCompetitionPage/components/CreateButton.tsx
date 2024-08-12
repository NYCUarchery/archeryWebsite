import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useState } from "react";
import { useMutation } from "react-query";
import Button from "@mui/material/Button";
import axios from "axios";
import { PostCompetitionBody } from "../types/PostCompetitionBody";
import { Signal } from "@preact/signals-react";
import { useNavigate } from "react-router-dom";
import routing from "../../../util/routing";

const postCompetition = (newCompetition: PostCompetitionBody) => {
  return axios.post("/api/competition", newCompetition);
};

type Props = {
  postBody: Signal<PostCompetitionBody>;
};

const CreateButton: React.FC<Props> = ({ postBody }: Props) => {
  const [isCreationSuccess, setIsCreationSuccess] = useState(false);
  const [isCreationError, setIsCreationError] = useState(false);
  const navigate = useNavigate();
  const { mutate: createCompetition } = useMutation(postCompetition, {
    onSuccess: () => {
      setIsCreationSuccess(true);
    },
    onError: () => {
      setIsCreationError(true);
    },
  });

  const handleClick = () => {
    console.log(postBody.value);
    createCompetition(postBody.value);
  };

  return (
    <>
      <Snackbar
        open={isCreationSuccess}
        onClose={() => {
          setIsCreationSuccess(false);
          navigate(routing.RecentCompetitions);
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
