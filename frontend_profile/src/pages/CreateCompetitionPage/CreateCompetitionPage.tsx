import { Box, Card, CardContent } from "@mui/material";

import { useNavigate } from "react-router-dom";

import CompetitionPostFields from "./components/CompetitionPostFields";

import { signal } from "@preact/signals-react";

import { PostCompetitionBody } from "./types/PostCompetitionBody";

import CreateButton from "./components/CreateButton";
import useGetUid from "../../util/QueryHooks/useGetUid";
import { useEffect } from "react";

let postBody = signal<PostCompetitionBody>({} as PostCompetitionBody);
const CreateContestPage = () => {
  const { data: uid, isSuccess, isError } = useGetUid();
  const navigate = useNavigate();
  useEffect(() => {
    if (isError) {
      navigate("/Login");
    }
    postBody.value = { ...postBody.value, host_id: uid };
  }, [isSuccess]);

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <CompetitionPostFields postBody={postBody} />
        <Box sx={{ display: "flex", mt: 2, justifyContent: "center" }}>
          <CreateButton postBody={postBody.value}></CreateButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateContestPage;
