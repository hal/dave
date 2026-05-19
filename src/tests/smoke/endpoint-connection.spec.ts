import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";

useWildFlyContainer(test, "smoke/endpoint_connection");

test.describe("Endpoint connection", () => {
  test("connects to WildFly via connect parameter", async ({ connectedPage }) => {
    await expect(connectedPage.page.locator("#hal-main-id")).toBeVisible();
  });

  test("endpoint modal does not appear with connect parameter", async ({ connectedPage }) => {
    const modal = connectedPage.page.getByRole("dialog", {
      name: "Connect to WildFly",
    });
    await expect(modal).toBeHidden();
  });
});
