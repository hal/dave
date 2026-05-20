import type { Page } from "@playwright/test";
import { MAIN_ID } from "@halconsole/ouia";
import { ouiaSelector } from "../utils/ouia.js";

export const MAIN_CONTENT = ouiaSelector(MAIN_ID);

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
