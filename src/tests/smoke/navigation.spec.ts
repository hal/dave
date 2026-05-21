import { test, expect } from "../../fixtures/pages.fixture.js";
import { NAV_ITEM_NAMES } from "../../pages/navigation.page.js";
import { MAIN_CONTENT } from "../../pages/base.page.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "smoke/navigation" });

test.describe("Navigation", { tag: [Tag.SMOKE, Tag.NAVIGATION] }, () => {
  for (const item of NAV_ITEM_NAMES) {
    test(`navigates to ${item}`, async ({ navigationPage }) => {
      await navigationPage.navigateTo(item);
      await expect(navigationPage.page.locator(MAIN_CONTENT)).toBeVisible();
    });
  }
});
