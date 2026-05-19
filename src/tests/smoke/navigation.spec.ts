import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { NAV_ITEMS } from "../../pages/navigation.page.js";
import { MAIN_CONTENT_ID } from "../../pages/base.page.js";

useWildFlyContainer(test, "smoke/navigation");

test.describe("Navigation", () => {
  for (const item of NAV_ITEMS) {
    test(`navigates to ${item}`, async ({ connectedPage, navigationPage }) => {
      await navigationPage.navigateTo(item);
      await expect(connectedPage.page.locator(MAIN_CONTENT_ID)).toBeVisible();
    });
  }
});
