import type { Page } from "@playwright/test";

export const MAIN_CONTENT = "main";

export class BasePage {
  constructor(
    readonly page: Page,
    readonly managementUrl: string,
  ) {}

  async open(): Promise<void> {
    await this.enableOuia();
    await this.page.goto(`/?connect=${this.managementUrl}`);
    await this.page.locator(MAIN_CONTENT).waitFor({ state: "visible" });
  }

  private async enableOuia(): Promise<void> {
    await this.page.addInitScript(() => {
      localStorage.setItem("ouia", "true");
    });
  }
}
