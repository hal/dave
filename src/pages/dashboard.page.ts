import type { Locator, Page } from "@playwright/test";
import { LOG_SHOW_BTN, MAIN_ID, PAGE_DASHBOARD_HEADER } from "@halconsole/ouia";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly overviewSection: Locator;
  readonly hostSection: Locator;
  readonly jvmSection: Locator;
  readonly memorySection: Locator;
  readonly logSection: Locator;
  readonly showLogButton: Locator;
  readonly generalResources: Locator;
  readonly getHelp: Locator;

  constructor(page: Page) {
    super(page);
    const main = page.locator(`#${MAIN_ID}`);
    this.heading = page.locator(ouiaSelector(PAGE_DASHBOARD_HEADER)).getByRole("heading", { level: 1 });
    this.overviewSection = main.getByRole("heading", { name: "Overview", level: 2 });
    this.hostSection = main.getByRole("heading", { name: "Host", level: 2 });
    this.jvmSection = main.getByRole("heading", { name: "JVM", level: 2 });
    this.memorySection = main.getByRole("heading", { name: "Memory & Threads", level: 2 });
    this.logSection = main.getByRole("heading", { name: "server.log", level: 2 });
    this.showLogButton = page.locator(ouiaSelector(LOG_SHOW_BTN));
    this.generalResources = main.getByRole("heading", { name: "General Resources", level: 2 });
    this.getHelp = main.getByRole("heading", { name: "Get Help", level: 2 });
  }
}
