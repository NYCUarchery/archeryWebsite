import { useSelector } from "react-redux";

export default function GroupPhaseTag() {
  const currentPhase = useSelector((state: any) => state.game.currentPhase);
  const userGroup = useSelector((state: any) => state.user.userGroup);
  const groups = useSelector((state: any) => state.game.groups);
  const phases = useSelector((state: any) => state.game.phases);

  if (groups === undefined || phases === undefined) {
    return <></>;
  }

  return (
    <div className="group_phase_tag">
      {groups[userGroup]} {phases[currentPhase]}
    </div>
  );
}
