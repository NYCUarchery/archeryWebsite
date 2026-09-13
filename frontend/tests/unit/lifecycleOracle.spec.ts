import { describe, expect, it } from "vitest";
import { compoundQualificationOracle, recurveQualificationOracle } from "../e2e/lifecycle/data";

const literalRows = [...recurveQualificationOracle, ...compoundQualificationOracle];

describe("competition lifecycle qualification oracle", () => {
  it("has six ends and one explicit, unique total for each of the 24 archers", () => {
    expect(literalRows).toHaveLength(24);
    expect(new Set(literalRows.map(({ total }) => total)).size).toBe(24);
    for (const { total, arrows } of literalRows) {
      expect(arrows).toMatch(/^[X9]{36}$/);
      expect([...arrows].reduce((sum, arrow) => sum + (arrow === "X" ? 10 : 9), 0)).toBe(total);
    }
  });
});
