import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { NAV_ITEMS } from "../../pages/navigation.page.js";
import { MAIN_CONTENT_ID } from "../../pages/base.page.js";
import { Tag } from "../../tags.js";

useWildFlyContainer(test, "smoke/navigation");

test.describe("Navigation", { tag: [Tag.SMOKE, Tag.NAVIGATION] }, () => {
  for (const item of NAV_ITEMS) {
    test(`navigates to ${item}`, async ({ navigationPage }) => {
      await navigationPage.open();
      await navigationPage.navigateTo(item);
      await expect(navigationPage.page.locator(MAIN_CONTENT_ID)).toBeVisible();
    });
  }
});
