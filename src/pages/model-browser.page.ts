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
} from "@halconsole/ouia";
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
    this.tree = page.getByRole("tree");
    this.resourceHeading = page.locator(`#${MAIN_ID}`).getByRole("heading", { level: 1 });
    this.backButton = page.locator(ouiaSelector(MODEL_BROWSER_BACK_BTN));
    this.forwardButton = page.locator(ouiaSelector(MODEL_BROWSER_FORWARD_BTN));
    this.homeButton = page.locator(ouiaSelector(MODEL_BROWSER_HOME_BTN));
    this.refreshButton = page.locator(ouiaSelector(MODEL_BROWSER_REFRESH_BTN));
    this.findButton = page.locator(ouiaSelector(MODEL_BROWSER_FIND_BTN));
    this.collapseButton = page.locator(ouiaSelector(MODEL_BROWSER_COLLAPSE_BTN));
    this.findResourceModal = page.locator(ouiaSelector(FIND_RESOURCE_MODAL));
    this.findResourceCancelButton = page.locator(ouiaSelector(FIND_RESOURCE_CANCEL_BTN));
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
    await this.page.locator(`#${MAIN_ID}`).waitFor({ state: "visible" });
  }

  breadcrumb(): Locator {
    return this.page.locator(`#${MAIN_ID}`).locator("nav").last();
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
