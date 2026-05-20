import type { Locator, Page } from "@playwright/test";
import { PAGE_DASHBOARD_HEADER } from "@halconsole/ouia";
import { ouiaSelector } from "../utils/ouia.js";
import { BasePage } from "./base.page.js";

export class DashboardPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page, managementUrl: string) {
    super(page, managementUrl);
    this.heading = page.locator(ouiaSelector(PAGE_DASHBOARD_HEADER));
  }
}
