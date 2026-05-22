import { test, expect } from "../../fixtures/wildfly.fixture.js";
import { Tag } from "../../tags.js";

test.describe("App loads", { tag: [Tag.SMOKE.value] }, () => {
  test("halOP serves the SPA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/hal/i);
  });
});
