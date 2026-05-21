import type { Locator, Page } from "@playwright/test";
import { MAIN_ID, NAV_CONFIGURATION } from "@halconsole/ouia";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

const CONFIGURATION_ITEMS = ["Subsystems", "Interfaces", "Socket Bindings", "Paths", "System Properties"] as const;

export type ConfigurationItem = (typeof CONFIGURATION_ITEMS)[number];

export { CONFIGURATION_ITEMS };

export class ConfigurationPage extends BasePage {
  readonly heading: Locator;
  readonly tree: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(`#${MAIN_ID}`).getByRole("heading", { name: "Configuration", level: 1 });
    this.tree = page.getByRole("tree");
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_CONFIGURATION)).click();
    await this.tree.waitFor({ state: "visible" });
  }

  treeItem(name: string): Locator {
    return this.page.getByRole("treeitem", { name, exact: true });
  }
}
