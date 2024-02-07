import { Routes, Route } from "react-router-dom";
import Homepage from "../pages/Homepage";
import PersonalPage from "../pages/PersonalPage";
import AboutPage from "../pages/AboutPage";
import ContestPage from "../pages/CompetitionPage/CompetitionPage";
import MyCompetitionPage from "../pages/MyCompetitionPage/MyCompetitionPage";
import ChangeInfo from "../pages/ChangeInfo";
import CreateContestPage from "../pages/CreateCompetitionPage/CreateCompetitionPage";
import routing from "../util/routing";

const PageRoute = () => {
  return (
    <Routes>
      <Route path={routing.Home} element={<Homepage />} />
      <Route path={routing.Personal} element={<PersonalPage />} />
      <Route path={routing.About} element={<AboutPage />} />
      <Route path={routing.Contests} element={<ContestPage />} />
      <Route path={routing.MyCompetition} element={<MyCompetitionPage />} />
      <Route path={routing.MyCompetition} element={<ContestPage />} />
      <Route path={routing.ChangeInfo} element={<ChangeInfo />} />
      <Route path={routing.CreateContest} element={<CreateContestPage />} />
    </Routes>
  );
};

export default PageRoute;
