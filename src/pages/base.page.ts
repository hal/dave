import type { Page } from "@playwright/test";

export const MAIN_CONTENT = "main";

/** Base page object — navigates to halOP with a WildFly connect parameter. */
export class BasePage {
  constructor(
    readonly page: Page,
    readonly managementUrl: string,
  ) {}

  async open(): Promise<void> {
    await this.page.goto(`/?connect=${this.managementUrl}`);
    await this.page.locator(MAIN_CONTENT).waitFor({ state: "visible" });
  }
}
