import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.js";

const HEADING_TEXT = "WildFly Application Server";

export class DashboardPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page, managementUrl: string) {
    super(page, managementUrl);
    this.heading = page.getByRole("heading", { name: HEADING_TEXT });
  }
}
