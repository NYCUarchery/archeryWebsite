import { Routes, Route } from "react-router-dom";
import Homepage from "../pages/Homepage";
import PersonalPage from "../pages/PersonalPage";
import AboutPage from "../pages/AboutPage";
import RecentCompetitionPage from "../pages/RecentCompetitionPage/RecentCompetitionPage";
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
      <Route
        path={routing.RecentCompetitions}
        element={<RecentCompetitionPage />}
      />
      <Route path={routing.MyCompetition} element={<MyCompetitionPage />} />
      <Route path={routing.ChangeInfo} element={<ChangeInfo />} />
      <Route path={routing.CreateContest} element={<CreateContestPage />} />
    </Routes>
  );
};

export default PageRoute;
