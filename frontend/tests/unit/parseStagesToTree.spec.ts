import { describe, expect, test } from "vitest";
import type { DatabaseMatchResult, DatabaseStage } from "@/types/Api";
import { parseStagesToTree, type TreeNode } from "@/utils/parseStagesToTree";

function completeBracket(
  firstMatchResults: [DatabaseMatchResult, DatabaseMatchResult],
  secondMatchResults: [DatabaseMatchResult, DatabaseMatchResult],
): DatabaseStage[] {
  return [
    {
      id: 1,
      matchs: [
        { id: 11, match_results: firstMatchResults },
        { id: 12, match_results: secondMatchResults },
      ],
    },
    {
      id: 2,
      matchs: [
        { id: 21, match_results: [{ id: 201 }, { id: 202 }] },
        { id: 22, match_results: [{ id: 203 }, { id: 204 }] },
      ],
    },
  ];
}

function flatten(root: TreeNode | undefined): TreeNode[] {
  return root ? [root, ...root.children.flatMap(flatten)] : [];
}

function kindFor(nodes: TreeNode[], resultId: number) {
  return nodes.find((node) => node.result.id === resultId)?.kind;
}

describe("parseStagesToTree placeholder semantics", () => {
  test("marks only the empty side of a one-sided first-round match as a bye", () => {
    const { goldRoot, bronzeRoot, silverRoot } = parseStagesToTree(
      completeBracket(
        [{ id: 101, player_set_id: 1 }, { id: 102 }],
        [{ id: 103 }, { id: 104 }],
      ),
    );
    const nodes = [
      ...flatten(goldRoot),
      ...flatten(bronzeRoot),
      ...flatten(silverRoot),
    ];

    expect(kindFor(nodes, 101)).toBe("participant");
    expect(kindFor(nodes, 102)).toBe("bye");
    expect(kindFor(nodes, 103)).toBe("pending");
    expect(kindFor(nodes, 104)).toBe("pending");
    expect(kindFor(nodes, 201)).toBe("pending");
    expect(kindFor(nodes, 202)).toBe("pending");
  });

  test("keeps both occupied first-round sides as participants", () => {
    const { goldRoot } = parseStagesToTree(
      completeBracket(
        [
          { id: 101, player_set_id: 1 },
          { id: 102, player_set_id: 2 },
        ],
        [{ id: 103 }, { id: 104 }],
      ),
    );
    const nodes = flatten(goldRoot);

    expect(kindFor(nodes, 101)).toBe("participant");
    expect(kindFor(nodes, 102)).toBe("participant");
  });
});
