import type { Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/** Save images for the dedicated user-manual browser scenarios. */
export async function manualScreenshot(
  page: Page,
  name: string,
  options: { mobile?: boolean; fullPage?: boolean } = {},
) {
  const file = path.resolve(process.cwd(), "../docs/user-manual-images", `${name}.png`);
  await mkdir(path.dirname(file), { recursive: true });
  const originalViewport = page.viewportSize();
  if (options.mobile) await page.setViewportSize({ width: 430, height: 932 });
  await page.screenshot({
    path: file,
    fullPage: options.fullPage ?? !options.mobile,
    animations: "disabled",
  });
  if (options.mobile && originalViewport) await page.setViewportSize(originalViewport);
}
