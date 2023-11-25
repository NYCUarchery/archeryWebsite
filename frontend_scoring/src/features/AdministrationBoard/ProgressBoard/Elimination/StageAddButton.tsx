import { Button } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";

const postStage = (eliminationID: number) => {
  return axios.post(`/api/elimination/stage/`, {
    elimination_id: eliminationID,
  });
};

interface Props {
  eliminationID: number;
}

export default function StageAddButton({ eliminationID }: Props) {
  const { mutate: addStage } = useMutation(postStage, {
    onSuccess: () => {
      console.log("success");
    },
  });

  const handleClick = () => {
    addStage(eliminationID);
  };
  return <Button onClick={handleClick}>新增一輪</Button>;
}
