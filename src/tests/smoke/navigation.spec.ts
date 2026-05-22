import { MAIN_ID } from "../../selectors/ids.js";
import { test, expect } from "../../fixtures/pages.fixture.js";
import { NAV_ITEM_NAMES } from "../../pages/navigation.page.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "smoke/navigation" });

test.describe("Navigation", { tag: [Tag.SMOKE.value, Tag.NAVIGATION.value] }, () => {
  for (const item of NAV_ITEM_NAMES) {
    test(`navigates to ${item}`, async ({ navigationPage }) => {
      await navigationPage.navigateTo(item);
      await expect(navigationPage.page.locator(`#${MAIN_ID}`)).toBeVisible();
    });
  }
});
