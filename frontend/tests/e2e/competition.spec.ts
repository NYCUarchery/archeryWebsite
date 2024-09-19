import { test, expect } from "@playwright/test";
import { User } from "./data";

const host = new User("我好醜");
const players = [
  new User("陳鈞鈴"),
  new User("王心柔"),
  new User("廖俊逸"),
  new User("杜培茵"),
  new User("蘇煒翔"),
];
const admins = [new User("盧均祐"), new User("吳柏橙")];

test.describe("Competition", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1/");
  });
});
