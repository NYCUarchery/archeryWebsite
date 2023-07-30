import { useSelector } from "react-redux/es/hooks/useSelector";

export default function GroupPhaseTag() {
  const currentPhase = useSelector(
    (state: any) => state.gameStateController.currentPhase
  );
  const userGroup = useSelector((state: any) => state.userState.userGroup);
  const groups = useSelector((state: any) => state.gameStateController.groups);
  const phases = useSelector((state: any) => state.gameStateController.phases);
  return (
    <div className="group_phase_tag">
      {groups[userGroup]} {phases[currentPhase]}
    </div>
  );
}
