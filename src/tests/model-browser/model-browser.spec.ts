import { testWithWildFly as test, expect } from "../../fixtures/test.fixture.js";
import { TOP_LEVEL_RESOURCES } from "../../pages/model-browser.page.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "model-browser/model-browser" });

test.describe("Model Browser", { tag: [Tag.MODEL_BROWSER] }, () => {
  test("shows tree and root resource", async ({ modelBrowserPage }) => {
    await modelBrowserPage.open();

    await expect(modelBrowserPage.tree).toBeVisible();
    for (const resource of TOP_LEVEL_RESOURCES) {
      await expect(modelBrowserPage.treeItem(resource)).toBeVisible();
    }

    await expect(modelBrowserPage.resourceHeading).toHaveText("Management Model");
    await expect(modelBrowserPage.tab("Data")).toHaveAttribute("aria-selected", "true");
  });

  test("selects resource in tree", async ({ modelBrowserPage }) => {
    await modelBrowserPage.open();
    await modelBrowserPage.selectTreeItem("subsystem");

    await expect(modelBrowserPage.resourceHeading).toContainText("subsystem");
    const breadcrumbText = await modelBrowserPage.breadcrumbText();
    expect(breadcrumbText).toContain("subsystem");
  });

  test("navigates to specific subsystem", async ({ modelBrowserPage }) => {
    await modelBrowserPage.open();
    await modelBrowserPage.navigateToChild("subsystem", "datasources");

    await expect(modelBrowserPage.resourceHeading).toContainText("datasources");
    const breadcrumbText = await modelBrowserPage.breadcrumbText();
    expect(breadcrumbText).toContain("subsystem=datasources");
  });

  test("switches tabs", async ({ modelBrowserPage }) => {
    await modelBrowserPage.open();
    await modelBrowserPage.navigateToChild("subsystem", "datasources");

    await expect(modelBrowserPage.tab("Data")).toBeVisible();
    await expect(modelBrowserPage.tab("Attributes")).toBeVisible();
    await expect(modelBrowserPage.tab("Operations")).toBeVisible();
    await expect(modelBrowserPage.tab("Capabilities")).toBeVisible();

    await modelBrowserPage.selectTab("Operations");
    await expect(modelBrowserPage.tabPanel("Operations")).toBeVisible();
    const operationsPanel = modelBrowserPage.tabPanel("Operations");
    await expect(operationsPanel.getByText("add", { exact: true })).toBeVisible();
    await expect(operationsPanel.getByText("remove", { exact: true })).toBeVisible();
  });

  test("shows operations with global toggle", async ({ modelBrowserPage }) => {
    await modelBrowserPage.open();
    await modelBrowserPage.navigateToChild("subsystem", "datasources");
    await modelBrowserPage.selectTab("Operations");

    await expect(modelBrowserPage.globalOperationsSwitch()).toBeVisible();
    await expect(modelBrowserPage.page.getByText("4 / 26 operations")).toBeVisible();
  });

  test("shows attributes tab with filter and count", async ({ modelBrowserPage }) => {
    await modelBrowserPage.open();
    await modelBrowserPage.selectTab("Attributes");

    const attributesPanel = modelBrowserPage.tabPanel("Attributes");
    await expect(attributesPanel.getByText("19 attributes")).toBeVisible();
    await expect(modelBrowserPage.filterInput()).toBeVisible();
    await expect(attributesPanel.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(attributesPanel.getByRole("columnheader", { name: "Type" })).toBeVisible();
  });
});
