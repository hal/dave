import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "smoke/dashboard" });

test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
  test("shows dashboard heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });
});
