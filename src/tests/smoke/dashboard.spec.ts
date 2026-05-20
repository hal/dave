import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { Tag } from "../../tags.js";

useWildFlyContainer(test, "smoke/dashboard");

test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
  test("shows dashboard heading", async ({ dashboardPage }) => {
    await dashboardPage.open();
    await expect(dashboardPage.heading).toBeVisible();
  });
});
