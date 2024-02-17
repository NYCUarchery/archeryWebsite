import { useMutation } from "react-query";
import axios from "axios";
import { useSelector } from "react-redux";
import { Button } from "@mui/material";

const putRanking = (competitionID: number) => {
  return axios.put(`/api/competition/groups/players/rank/${competitionID}`);
};
const putCalculateTotals = (competitionID: number) => {
  return axios.put(
    `/api/competition/groups/players/playertotal/${competitionID}`
  );
};

export default function RankingButton() {
  const { mutate: rank } = useMutation(putRanking, {
    onSuccess: () => {
      alert("Ranking successed");
    },
    onError: () => {
      alert("Ranking failed");
    },
  });
  const { mutate: calculateTotals } = useMutation(putCalculateTotals, {
    onSuccess: () => {
      alert("Calculate totals successed");
    },
    onError: () => {
      alert("Calculate totals failed");
    },
  });
  const competitionID = useSelector((state: any) => state.game.competitionID);

  const handleClick = () => {
    calculateTotals(competitionID);
    rank(competitionID);
  };

  return <Button onClick={handleClick}>更新排名</Button>;
}
