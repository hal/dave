import { test, expect } from "../../fixtures/test.fixture.js";
import { Tag } from "../../tags.js";

test.describe("App loads", { tag: [Tag.SMOKE] }, () => {
  test("halOP serves the SPA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/hal/i);
  });
});
