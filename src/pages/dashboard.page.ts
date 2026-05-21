import type { Locator, Page } from "@playwright/test";
import { PAGE_DASHBOARD_HEADER } from "@halconsole/ouia";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

/** Dashboard page object — provides the main heading locator. */
export class DashboardPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(ouiaSelector(PAGE_DASHBOARD_HEADER)).getByRole("heading", { level: 1 });
  }
}
