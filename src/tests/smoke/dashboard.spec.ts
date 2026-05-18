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
  wildfly = await startWildFlyContainer(containerNameFromSpec("smoke/dashboard"));
  setWildFly(wildfly);
});

test.afterAll(async () => {
  clearWildFly();
  if (wildfly) {
    await stopWildFlyContainer(wildfly);
  }
});

test.describe("Dashboard", () => {
  test("shows dashboard heading", async ({ connectedPage, dashboardPage }) => {
    void connectedPage;
    await expect(dashboardPage.heading).toBeVisible();
  });
});
