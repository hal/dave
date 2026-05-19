import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";

useWildFlyContainer(test, "smoke/dashboard");

test.describe("Dashboard", () => {
  test("shows dashboard heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });
});
