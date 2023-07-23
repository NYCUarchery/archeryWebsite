import LastStageButton from "./LastStageButton";
import StageList from "./StageList/StageList";
import NextStageButton from "./NextStageButton";
import StageListButton from "./StageListButton";
import { useSelector } from "react-redux";

export default function StageController() {
  const phaseShown = useSelector(
    (state: any) => state.phaseListButton.phaseShown
  );

  if (phaseShown === 0) {
    return null;
  }

  return (
    <div className="stage_controller">
      <LastStageButton />
      <StageList />
      <StageListButton />
      <NextStageButton />
    </div>
  );
}
