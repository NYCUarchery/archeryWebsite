import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
}

describe("admin responsive layout contracts", () => {
  it("keeps qualification and elimination schedule cards within narrow containers", () => {
    for (const path of [
      "app/competition/[id]/admin/schedule/qualification/layout.tsx",
      "app/competition/[id]/admin/schedule/elimination/[teamSize]/layout.tsx",
    ]) {
      const layout = source(path);
      expect(layout).toContain('size={{ xs: 12, md: 3 }}');
      expect(layout).toContain('size={{ xs: 12, md: 9 }}');
      expect(layout).toContain('minWidth: 0');
      expect(layout).toContain('overflowX: "auto"');
    }
  });

  it("makes every admin tab layer horizontally scrollable on mobile", () => {
    for (const path of [
      "app/competition/[id]/admin/layout.tsx",
      "app/competition/[id]/admin/progress/layout.tsx",
      "app/competition/[id]/admin/schedule/layout.tsx",
    ]) {
      const layout = source(path);
      expect(layout).toContain('variant="scrollable"');
      expect(layout).toContain('scrollButtons="auto"');
      expect(layout).toContain("allowScrollButtonsMobile");
    }
  });
});
