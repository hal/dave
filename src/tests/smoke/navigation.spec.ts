import { test, expect } from "../../fixtures/test.fixture.js";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
} from "../../utils/wildfly-container.js";
import { setWildFly, clearWildFly } from "../../fixtures/test.fixture.js";
import type { WildFlyContainer } from "../../utils/wildfly-container.js";
import { NAV_ITEMS } from "../../pages/navigation.page.js";

let wildfly: WildFlyContainer | undefined;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  wildfly = await startWildFlyContainer(containerNameFromSpec("smoke/navigation"));
  setWildFly(wildfly);
});

test.afterAll(async () => {
  clearWildFly();
  if (wildfly) {
    await stopWildFlyContainer(wildfly);
  }
});

test.describe("Navigation", () => {
  for (const item of NAV_ITEMS) {
    test(`navigates to ${item}`, async ({ connectedPage, navigationPage }) => {
      void connectedPage;
      await navigationPage.navigateTo(item);
      await expect(navigationPage.page.locator("#hal-main-id")).toBeVisible();
    });
  }
});
