import type { Locator, Page } from "@playwright/test";
import { MAIN, NAV_TASKS, PAGE_TASKS_HEADER } from "../selectors/ids.js";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

const TASK_NAMES = ["Data source", "Logging", "Management SSL", "Reverse proxy", "SSL", "Statistics"] as const;

export type TaskName = (typeof TASK_NAMES)[number];

export { TASK_NAMES };

export class TasksPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(ouiaSelector(PAGE_TASKS_HEADER)).getByRole("heading", { level: 1 });
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_TASKS)).click();
    await this.page.locator(ouiaSelector(MAIN)).waitFor({ state: "visible" });
  }

  taskCard(name: string): Locator {
    return this.page
      .locator('[data-ouia-component-type="PF6/Component/Card"]')
      .filter({ has: this.page.getByRole("heading", { name, level: 2, exact: true }) });
  }
}
