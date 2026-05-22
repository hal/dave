import { test, expect } from "../../fixtures/pages.fixture.js";
import { TOP_LEVEL_RESOURCES } from "../../pages/model-browser.page.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "model-browser/model-browser" });

test.describe("Model Browser", { tag: [Tag.MODEL_BROWSER.value] }, () => {
  test("shows tree and root resource", async ({ modelBrowserPage }) => {
    await expect(modelBrowserPage.tree).toBeVisible();
    for (const resource of TOP_LEVEL_RESOURCES) {
      await expect(modelBrowserPage.treeItem(resource)).toBeVisible();
    }

    await expect(modelBrowserPage.resourceHeading).toHaveText("Management Model");
    await expect(modelBrowserPage.tab("Data")).toHaveAttribute("aria-selected", "true");
  });

  test("selects resource in tree", async ({ modelBrowserPage }) => {
    await modelBrowserPage.selectTreeItem("subsystem");

    await expect(modelBrowserPage.resourceHeading).toContainText("subsystem");
    const breadcrumbText = await modelBrowserPage.breadcrumbText();
    expect(breadcrumbText).toContain("subsystem");
  });

  test("navigates to specific subsystem", async ({ modelBrowserPage }) => {
    await modelBrowserPage.navigateToChild("subsystem", "datasources");

    await expect(modelBrowserPage.resourceHeading).toContainText("datasources");
    const breadcrumbText = await modelBrowserPage.breadcrumbText();
    expect(breadcrumbText).toContain("subsystem=datasources");
  });

  test("switches tabs", async ({ modelBrowserPage }) => {
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
    await modelBrowserPage.navigateToChild("subsystem", "datasources");
    await modelBrowserPage.selectTab("Operations");

    await expect(modelBrowserPage.globalOperationsSwitch()).toBeVisible();
    await expect(modelBrowserPage.page.getByText("4 / 26 operations")).toBeVisible();
  });

  test("shows toolbar buttons", async ({ modelBrowserPage }) => {
    await expect(modelBrowserPage.backButton).toBeVisible();
    await expect(modelBrowserPage.forwardButton).toBeVisible();
    await expect(modelBrowserPage.homeButton).toBeVisible();
    await expect(modelBrowserPage.refreshButton).toBeVisible();
    await expect(modelBrowserPage.findButton).toBeVisible();
    await expect(modelBrowserPage.collapseButton).toBeVisible();
    await expect(modelBrowserPage.backButton).toBeDisabled();
    await expect(modelBrowserPage.forwardButton).toBeDisabled();
  });

  test("opens find resource modal", async ({ modelBrowserPage }) => {
    await modelBrowserPage.findButton.click();
    await expect(modelBrowserPage.findResourceModal).toBeVisible();
    await modelBrowserPage.findResourceCancelButton.click();
    await expect(modelBrowserPage.findResourceModal).toBeHidden();
  });

  test("shows attributes tab with filter and count", async ({ modelBrowserPage }) => {
    await modelBrowserPage.selectTab("Attributes");

    const attributesPanel = modelBrowserPage.tabPanel("Attributes");
    await expect(attributesPanel.getByText("19 attributes")).toBeVisible();
    await expect(modelBrowserPage.filterInput()).toBeVisible();
    await expect(attributesPanel.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(attributesPanel.getByRole("columnheader", { name: "Type" })).toBeVisible();
  });
});
