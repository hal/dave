import type { Locator, Page } from "@playwright/test";
import { BasePage, MAIN_CONTENT_ID } from "./base.page.js";

const MANAGEMENT_MODEL_LINK = "Management model";

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

export class ModelBrowserPage extends BasePage {
  readonly tree: Locator;
  readonly resourceHeading: Locator;

  constructor(page: Page, managementUrl: string) {
    super(page, managementUrl);
    this.tree = page.getByRole("tree");
    this.resourceHeading = page.locator(`${MAIN_CONTENT_ID} h1`);
  }

  async open(): Promise<void> {
    await super.open();
    await this.page.getByRole("link", { name: MANAGEMENT_MODEL_LINK }).click();
    await this.tree.waitFor({ state: "visible" });
  }

  treeItem(name: string): Locator {
    return this.page.getByRole("treeitem", { name, exact: true });
  }

  async selectTreeItem(name: string): Promise<void> {
    await this.treeItem(name).click();
    await this.page.locator(MAIN_CONTENT_ID).waitFor({ state: "visible" });
  }

  async expandTreeItem(name: string): Promise<void> {
    const item = this.treeItem(name);
    const isExpanded = await item.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await item.getByRole("button").first().click();
    }
  }

  breadcrumb(): Locator {
    return this.page.locator(`${MAIN_CONTENT_ID}`).locator("nav");
  }

  async breadcrumbText(): Promise<string> {
    return (await this.breadcrumb().textContent()) ?? "";
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
