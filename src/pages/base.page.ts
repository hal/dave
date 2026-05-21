import type { Page } from "@playwright/test";

export const MAIN_CONTENT = "main";

/** Base page object — locators and actions for the halOP UI. */
export class BasePage {
  constructor(readonly page: Page) {}
}
