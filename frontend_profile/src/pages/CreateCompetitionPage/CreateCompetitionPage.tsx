import { Card, CardContent } from "@mui/material";

import { useNavigate } from "react-router-dom";

import CompetitionPostFields from "./components/CompetitionPostFields";

import { signal } from "@preact/signals-react";

import { PostCompetitionBody } from "./types/PostCompetitionBody";

import dayjs from "dayjs";
import CreateButton from "./components/CreateButton";

const postBody = signal<PostCompetitionBody>({} as PostCompetitionBody);
const CreateContestPage = () => {
  const navigate = useNavigate();
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <CompetitionPostFields postBody={postBody} />
        <CreateButton postBody={postBody.value}></CreateButton>
      </CardContent>
    </Card>
  );
};

export default CreateContestPage;
