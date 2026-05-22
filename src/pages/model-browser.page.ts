import type { Locator, Page } from "@playwright/test";
import {
  FIND_RESOURCE_CANCEL_BTN,
  FIND_RESOURCE_MODAL,
  MAIN_ID,
  MODEL_BROWSER_BACK_BTN,
  MODEL_BROWSER_COLLAPSE_BTN,
  MODEL_BROWSER_FIND_BTN,
  MODEL_BROWSER_FORWARD_BTN,
  MODEL_BROWSER_HOME_BTN,
  MODEL_BROWSER_REFRESH_BTN,
  NAV_MODEL_BROWSER,
} from "../selectors/ids.js";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

export type TabName = "Data" | "Attributes" | "Operations" | "Capabilities";

const TOP_LEVEL_RESOURCES = [
  "core-service",
  "deployment",
  "deployment-overlay",
  "extension",
  "interface",
  "path",
  "socket-binding-group",
  "subsystem",
  "system-property",
] as const;

export type TopLevelResource = (typeof TOP_LEVEL_RESOURCES)[number];

export { TOP_LEVEL_RESOURCES };

/** Model browser page object — tree navigation, resource details, tabs, and filtering. */
export class ModelBrowserPage extends BasePage {
  readonly main: Locator;
  readonly tree: Locator;
  readonly resourceHeading: Locator;
  readonly backButton: Locator;
  readonly forwardButton: Locator;
  readonly homeButton: Locator;
  readonly refreshButton: Locator;
  readonly findButton: Locator;
  readonly collapseButton: Locator;
  readonly findResourceModal: Locator;
  readonly findResourceCancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.main = page.locator(`#${MAIN_ID}`);
    this.tree = page.getByRole("tree");
    this.resourceHeading = this.main.getByRole("heading", { level: 1 });
    this.backButton = page.locator(ouiaSelector(MODEL_BROWSER_BACK_BTN));
    this.forwardButton = page.locator(ouiaSelector(MODEL_BROWSER_FORWARD_BTN));
    this.homeButton = page.locator(ouiaSelector(MODEL_BROWSER_HOME_BTN));
    this.refreshButton = page.locator(ouiaSelector(MODEL_BROWSER_REFRESH_BTN));
    this.findButton = page.locator(ouiaSelector(MODEL_BROWSER_FIND_BTN));
    this.collapseButton = page.locator(ouiaSelector(MODEL_BROWSER_COLLAPSE_BTN));
    this.findResourceModal = page.locator(ouiaSelector(FIND_RESOURCE_MODAL));
    this.findResourceCancelButton = page.locator(ouiaSelector(FIND_RESOURCE_CANCEL_BTN));
  }

  // ------------------------------------------------------ child resources

  noChildResources(): Locator {
    return this.main.getByRole("heading", { name: "No child resources", level: 4 });
  }

  childResourceText(name: string): Locator {
    return this.main.getByText(name, { exact: true });
  }

  addButton(): Locator {
    return this.main.getByRole("button", { name: "Add", exact: true });
  }

  viewButton(name: string): Locator {
    return this.main.locator(`li:has-text("${name}")`).getByRole("button", { name: "View", exact: true });
  }

  removeButton(name: string): Locator {
    return this.main.locator(`li:has-text("${name}")`).getByRole("button", { name: "Remove", exact: true });
  }

  async addChildResource(fields: Record<string, string>): Promise<void> {
    await this.addButton().click();
    const modal = this.page.getByRole("dialog");
    await modal.waitFor({ state: "visible" });
    for (const [label, value] of Object.entries(fields)) {
      await modal.getByRole("textbox", { name: label }).fill(value);
    }
    await modal.getByRole("button", { name: "Add", exact: true }).click();
    await modal.waitFor({ state: "hidden" });
  }

  async removeChildResource(name: string): Promise<void> {
    await this.removeButton(name).click();
    const dialog = this.page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
  }

  // ------------------------------------------------------ data tab editing

  editButton(): Locator {
    return this.tabPanel("Data").locator('[id^="edit-"]');
  }

  saveButton(): Locator {
    return this.tabPanel("Data").getByRole("button", { name: "Save", exact: true });
  }

  cancelEditButton(): Locator {
    return this.tabPanel("Data").getByRole("button", { name: "Cancel", exact: true });
  }

  dataAttributeInput(attrName: string): Locator {
    return this.tabPanel("Data").getByRole("textbox", { name: attrName });
  }

  dataAttributeValue(attrName: string): Locator {
    return this.tabPanel("Data").getByText(attrName).locator("..").locator("+ dd");
  }

  // ------------------------------------------------------ alerts

  successAlert(): Locator {
    return this.page.getByText("success alert:", { exact: false });
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_MODEL_BROWSER)).click();
    await this.tree.waitFor({ state: "visible" });
  }

  treeItem(name: string): Locator {
    return this.page.getByRole("treeitem", { name, exact: true });
  }

  async selectTreeItem(name: string): Promise<void> {
    await this.treeItem(name).click();
    await this.page.locator(`#${MAIN_ID}`).waitFor({ state: "visible" });
  }

  async expandTreeItem(name: string): Promise<void> {
    const item = this.treeItem(name);
    const isExpanded = await item.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await item.getByRole("button").first().click();
    }
  }

  async navigateToChild(parent: string, child: string): Promise<void> {
    await this.selectTreeItem(parent);
    await this.expandTreeItem(parent);
    const childItem = this.treeItem(child);
    await childItem.waitFor({ state: "visible" });
    await childItem.click();
    await this.resourceHeading.filter({ hasText: child }).waitFor({ state: "visible" });
  }

  breadcrumb(): Locator {
    return this.page.locator(`#${MAIN_ID}`).locator("nav").last().getByRole("list");
  }

  async breadcrumbText(): Promise<string | null> {
    return await this.breadcrumb().textContent();
  }

  tab(name: TabName): Locator {
    return this.page.getByRole("tab", { name });
  }

  async selectTab(name: TabName): Promise<void> {
    await this.tab(name).click();
    await this.page.getByRole("tabpanel", { name }).waitFor({ state: "visible" });
  }

  tabPanel(name: TabName): Locator {
    return this.page.getByRole("tabpanel", { name });
  }

  filterInput(): Locator {
    return this.page.getByRole("textbox", { name: "Filter by name" });
  }

  globalOperationsSwitch(): Locator {
    return this.page.getByRole("switch", { name: "Show global operations" });
  }
}
