import { test, expect } from "../../fixtures/pages.fixture.js";
import { CONFIGURATION_ITEMS } from "../../pages/configuration.page.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "configuration/configuration" });

test.describe("Configuration", { tag: [Tag.CONFIGURATION.value] }, () => {
  test("shows configuration heading", async ({ configurationPage }) => {
    await expect(configurationPage.heading).toBeVisible();
    await expect(configurationPage.heading).toHaveText("Configuration");
  });

  test("shows configuration tree", async ({ configurationPage }) => {
    await expect(configurationPage.tree).toBeVisible();
    for (const item of CONFIGURATION_ITEMS) {
      await expect(configurationPage.treeItem(item)).toBeVisible();
    }
  });

  test("shows description", async ({ configurationPage }) => {
    await expect(
      configurationPage.page.getByText("Configure subsystems and global resources", { exact: false }),
    ).toBeVisible();
  });
});
