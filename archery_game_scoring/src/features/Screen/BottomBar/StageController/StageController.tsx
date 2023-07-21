import LastStageButton from "./LastStageButton";
import StageList from "./StageList/StageList";
import NextStageButton from "./NextStageButton";

export default function StageController() {
  return (
    <div className="stage_controller">
      <LastStageButton />
      <StageList />
      <NextStageButton />
    </div>
  );
}
