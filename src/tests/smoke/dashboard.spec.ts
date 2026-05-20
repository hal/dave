import { testWithWildFly as test, expect } from "../../fixtures/test.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "smoke/dashboard" });

test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
  test("shows dashboard heading", async ({ dashboardPage }) => {
    await dashboardPage.open();
    await expect(dashboardPage.heading).toBeVisible();
  });
});
