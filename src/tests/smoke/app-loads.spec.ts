import { test, expect } from "../../fixtures/test.fixture.js";

test.describe("App loads", () => {
  test("halOP serves the SPA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/hal/i);
  });
});
