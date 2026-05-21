import type { Page } from "@playwright/test";

export const MAIN_CONTENT = "main";

/** Base page object — navigates to halOP with a WildFly connect parameter. */
export class BasePage {
  constructor(readonly page: Page) {}

  async open(managementUrl: string): Promise<void> {
    await this.page.goto(`/?connect=${managementUrl}`);
    await this.page.locator(MAIN_CONTENT).waitFor({ state: "visible" });
  }
}
