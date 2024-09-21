"use client";
import { Box, Card, CardContent } from "@mui/material";

import CompetitionPostFields from "./CompetitionPostFields";

import { PostCompetitionBody } from "./types/PostCompetitionBody";

import { signal } from "@preact/signals-react";
import CreateButton from "./CreateButton";

const postBody = signal<PostCompetitionBody>({} as PostCompetitionBody);
const CreateContestPage = () => {
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <CompetitionPostFields postBody={postBody} />
        <Box sx={{ display: "flex", mt: 2, justifyContent: "center" }}>
          <CreateButton postBody={postBody}></CreateButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateContestPage;
