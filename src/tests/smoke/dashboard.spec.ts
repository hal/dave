import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";

useWildFlyContainer(test, "smoke/dashboard");

test.describe("Dashboard", () => {
  test("shows dashboard heading", async ({ connectedPage, dashboardPage }) => {
    await connectedPage.waitForConsoleReady();
    await expect(dashboardPage.heading).toBeVisible();
  });
});
