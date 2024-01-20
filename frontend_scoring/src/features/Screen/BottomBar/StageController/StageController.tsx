import LastStageButton from "./LastStageButton";
import StageList from "./StageList/StageList";
import NextStageButton from "./NextStageButton";
import StageListButton from "./StageListButton";
import { useSelector } from "react-redux";

export default function StageController() {
  const phaseShown = useSelector(
    (state: any) => state.phaseListButton.phaseShown
  );
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);

  const currentPhaseKind = useSelector(
    (state: any) => state.game.currentPhaseKind
  );
  const phaseKindShown = useSelector(
    (state: any) => state.phaseListButton.phaseKindShown
  );
  if (phaseShown === 0 && boardShown === "score") {
    return null;
  }
  let phaseKind: string = "";
  switch (boardShown) {
    case "score":
      phaseKind = phaseKindShown;
      break;
    case "recording":
      phaseKind = currentPhaseKind;
      break;
  }

  return (
    <div className="stage_controller">
      <LastStageButton />
      <StageList phaseKind={phaseKind} />
      <StageListButton phaseKind={phaseKind} />
      <NextStageButton />
    </div>
  );
}
