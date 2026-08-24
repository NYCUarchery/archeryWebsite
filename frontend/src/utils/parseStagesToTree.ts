import { DatabaseStage, DatabaseMatchResult } from "@/types/Api";
import { isCompleteEliminationBracket } from "./eliminationBracket";

export interface TreeNode {
  result: DatabaseMatchResult;

  children: TreeNode[];
}
export function parseStagesToTree(stages: DatabaseStage[] | undefined) {
  // the number of matches of the first stage should be the power of 2
  if (!isCompleteEliminationBracket(stages)) {
    return { goldRoot: undefined, silverRoot: undefined, bronzeRoot: undefined };
  }

  const completeStages = stages ?? [];

  const stageLength = completeStages.length;

  const final = completeStages[stageLength - 1];

  const goldRoot: TreeNode = {
    result: getWinner(final.matchs?.[0]?.match_results ?? []),
    children: [],
  };

  const silverRoot: TreeNode = {
    result: getLoser(final.matchs?.[0]?.match_results ?? []),
    children: [],
  };

  const bronzeRoot: TreeNode = {
    result: getWinner(final.matchs?.[1]?.match_results ?? []),
    children: [],
  };

  bronzeRoot.children.push({
    result: final.matchs?.[1]?.match_results?.[0] ?? {},
    children: [],
  });

  bronzeRoot.children.push({
    result: final.matchs?.[1]?.match_results?.[1] ?? {},
    children: [],
  });

  const matchResultsToTreefy: DatabaseMatchResult[] = [];

  for (let i = completeStages[0].matchs!.length * 2; i >= 4; i /= 2) {
    for (let j = 0; j < i; j++) {
      matchResultsToTreefy.push({});
    }
    if (i === 4) {
      matchResultsToTreefy.push(final.matchs?.[0]?.match_results?.[1] ?? {});
      matchResultsToTreefy.push(final.matchs?.[0]?.match_results?.[0] ?? {});
    }
  }

  let matchResultsCounter = 0;

  for (let i = 0; i < stageLength - 1; i++) {
    const stage = completeStages[i];

    for (let j = stage.matchs!.length - 1; j >= 0; j--) {
      matchResultsToTreefy[matchResultsCounter] =
        stage.matchs?.[j]?.match_results?.[1] ?? {};
      matchResultsCounter++;
      matchResultsToTreefy[matchResultsCounter] =
        stage.matchs?.[j]?.match_results?.[0] ?? {};
      matchResultsCounter++;
    }
  }

  const nodesToTreefy = [goldRoot];

  let nodeCounter = 0;

  while (matchResultsToTreefy.length > 0) {
    const matchResult = matchResultsToTreefy.pop();

    const node = nodesToTreefy[nodeCounter];
    const newNode: TreeNode = {
      result: matchResult ?? {},
      children: [],
    };
    node.children.push(newNode);
    nodesToTreefy.push(newNode);
    if (node.children.length === 2) {
      nodeCounter++;
    }
  }

  return { goldRoot, silverRoot, bronzeRoot };
}

const getWinner = (matchResults: DatabaseMatchResult[]) => {
  const result1 = matchResults[0];
  const result2 = matchResults[1];

  if (result1 === undefined || result2 === undefined) {
    return {};
  }
  if (!result2.is_winner && !result1.is_winner) {
    return {};
  }
  if (result1.is_winner) {
    return result1;
  }
  return result2;
};

const getLoser = (matchResults: DatabaseMatchResult[]) => {
  const result1 = matchResults?.[0];
  const result2 = matchResults?.[1];

  if (result1 === undefined || result2 === undefined) {
    return {};
  }

  if (!result2.is_winner && !result1.is_winner) {
    return {};
  }

  if (result1.is_winner) {
    return result2;
  }
  return result1;
};
