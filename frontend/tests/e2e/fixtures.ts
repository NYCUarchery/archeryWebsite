import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { test as base, expect } from "@playwright/test";

const exec = promisify(execFile);

async function environmentCommand(command: "reset" | "restart", fixture?: string) {
  if (!process.env.ARCHERY_TEST_MANIFEST) {
    throw new Error("Real E2E requires scripts/test.sh e2e; no development database fallback");
  }
  await exec(process.execPath, [
    path.resolve(process.cwd(), "../scripts/test-env.mjs"), command,
    ...(fixture ? ["--fixture", fixture] : []),
  ], { env: process.env, timeout: 300_000, maxBuffer: 8 * 1024 * 1024 });
}

type Fixtures = {
  databaseFixture: "empty" | "legacy" | "accounts";
  isolatedDatabase: void;
  restartBackend: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  databaseFixture: ["legacy", { option: true }],
  isolatedDatabase: [async ({ browser, databaseFixture }, use) => {
    // This automatic fixture runs before page/context creation. Any manually
    // created role contexts are also closed before the next database reset.
    for (const context of browser.contexts()) await context.close();
    await environmentCommand("reset", databaseFixture);
    try { await use(); }
    finally {
      for (const context of browser.contexts()) await context.close();
    }
  }, { auto: true, timeout: 300_000 }],
  restartBackend: async ({ browser, isolatedDatabase }, use) => {
    void isolatedDatabase;
    await use(async () => {
      for (const context of browser.contexts()) await context.close();
      await environmentCommand("restart");
    });
  },
});

export { expect };
