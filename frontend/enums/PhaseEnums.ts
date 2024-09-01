export enum PhaseEnums {
  Qualification = "qualification",
  Elimination = "elimination",
  TeamElimination = "team-elimination",
  MixedElimination = "mixed-elimination",
}

export function getChinesePhaseName(phase: PhaseEnums) {
  switch (phase) {
    case PhaseEnums.Qualification:
      return "排名賽";
    case PhaseEnums.Elimination:
      return "個人賽";
    case PhaseEnums.TeamElimination:
      return "團體賽";
    case PhaseEnums.MixedElimination:
      return "混雙賽";
  }
}
