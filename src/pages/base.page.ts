import type { Page } from "@playwright/test";

const MAIN_CONTENT_ID = "#hal-main-id";
const CONNECT_PARAMETER = "connect";

export class BasePage {
  constructor(readonly page: Page) {}

  async enableOuia(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem("ouia", "true");
    });
  }

  async navigateWithConnect(wildflyUrl: string): Promise<void> {
    await this.page.goto(`/?${CONNECT_PARAMETER}=${wildflyUrl}`);
    await this.waitForConsoleReady();
  }

  async waitForConsoleReady(): Promise<void> {
    await this.page.locator(MAIN_CONTENT_ID).waitFor({ state: "visible" });
  }
}
