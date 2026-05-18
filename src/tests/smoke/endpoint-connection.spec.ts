import { test, expect } from "../../fixtures/test.fixture.js";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
} from "../../utils/wildfly-container.js";
import { setWildFly, clearWildFly } from "../../fixtures/test.fixture.js";
import type { WildFlyContainer } from "../../utils/wildfly-container.js";

let wildfly: WildFlyContainer | undefined;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  wildfly = await startWildFlyContainer(containerNameFromSpec("smoke/endpoint_connection"));
  setWildFly(wildfly);
});

test.afterAll(async () => {
  clearWildFly();
  if (wildfly) {
    await stopWildFlyContainer(wildfly);
  }
});

test.describe("Endpoint connection", () => {
  test("connects to WildFly via connect parameter", async ({
    connectedPage,
    page,
  }) => {
    await expect(page.locator("#hal-main-id")).toBeVisible();
    await expect(connectedPage.page.locator("#hal-main-id")).toBeVisible();
  });

  test("endpoint modal does not appear with connect parameter", async ({
    connectedPage,
  }) => {
    const modal = connectedPage.page.getByRole("dialog", {
      name: "Connect to WildFly",
    });
    await expect(modal).not.toBeVisible();
  });
});
