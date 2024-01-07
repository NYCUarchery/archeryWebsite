import React from "react";
import { useMutation } from "react-query";
import Button from "@mui/material/Button";
import axios from "axios";
import { PostCompetitionBody } from "../types/PostCompetitionBody";
import { Signal } from "@preact/signals-react";

const postCompetition = (newCompetition: PostCompetitionBody) => {
  return axios.post("/api/competition", newCompetition);
};

type Props = {
  postBody: Signal<PostCompetitionBody>;
};

const CreateButton: React.FC<Props> = ({ postBody }: Props) => {
  const { mutate: createCompetition } = useMutation(postCompetition);

  const handleClick = () => {
    console.log(postBody.value);
    createCompetition(postBody.value);
  };

  return (
    <Button variant="contained" color="primary" onClick={handleClick}>
      創建比賽
    </Button>
  );
};

export default CreateButton;
