import { useSelector } from "react-redux";
import { useQuery } from "react-query";
import axios from "axios";

const fetchCompetition = (competitionId: number) => {
  return axios.get(`http://localhost:8080/data/competition/${competitionId}`);
};

function GameTitle() {
  let competitionId = 1;
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);

  const { isLoading, data, isError } = useQuery(
    ["competition", competitionId],
    () => fetchCompetition(competitionId),
    {
      select: (data: any) => {
        const title = data?.data.title;
        const subTitle = data?.data.sub_title;
        return { title, subTitle };
      },
    }
  );

  let title = data?.title;
  let subTitle = data?.subTitle;

  if (isLoading) {
    title = "讓我看看";
    subTitle = "我還在找";
  }
  if (isError) {
    title = "窩不知道";
    subTitle = "窩不知道 :(";
  }

  return (
    <div className="game_title">
      <span
        className="game_main_title"
        style={{
          fontSize: boardShown !== "score" ? "30px" : "50px",
        }}
      >
        {title}
      </span>

      <br />
      {boardShown !== "score" ? null : (
        <span className="game_subtitle">{subTitle}</span>
      )}
    </div>
  );
}

export default GameTitle;
