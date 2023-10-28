import PlayerLists from "./PlayerLists/PlayerLists";
import GroupSelector from "./GroupSelector/GroupSelector";
import { useQuery } from "react-query";
import axios from "axios";
import { Box } from "@mui/system";

function fetchCompetitionById(id: number) {
  return axios.get(`/data/competition/groups/${id}`);
}

export default function GroupsBoard() {
  const { data, isLoading, isError } = useQuery(
    ["group", 1],
    () => fetchCompetitionById(1),
    {
      select: (data: any) => {
        const groups = data?.data.groups;
        return groups;
      },
    }
  );

  if (isLoading)
    return (
      <Box
        sx={{
          fontSize: "100px",
        }}
      >
        載入中辣
      </Box>
    );
  if (isError) {
    return (
      <Box
        sx={{
          fontSize: "100px",
        }}
      >
        載入失敗辣
      </Box>
    );
  }

  return (
    <div className="groups_board">
      <GroupSelector groups={data} />
      <PlayerLists />
    </div>
  );
}
