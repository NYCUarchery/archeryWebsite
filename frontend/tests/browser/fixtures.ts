import { expect, test as base } from "@playwright/test";

/**
 * Mock-browser tests must declare every backend request they depend on.  The
 * guard is an auto fixture, so its request list belongs to one Playwright test
 * instance and cannot leak between parallel tests.
 */
export const test = base.extend<{ apiMockGuard: void }>({
  apiMockGuard: [
    async ({ page }, use) => {
      const undeclaredRequests: string[] = [];
      await page.route("**/api/**", async (route) => {
        undeclaredRequests.push(`${route.request().method()} ${route.request().url()}`);
        await route.abort("failed");
      });

      await use();

      if (undeclaredRequests.length > 0) {
        throw new Error(
          `未宣告的業務 API request:\n${undeclaredRequests.join("\n")}`,
        );
      }
    },
    { auto: true },
  ],
});

export { expect };
