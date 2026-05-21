import type { Page } from "@playwright/test";

/**
 * Base page object — provides the shared Page accessor for all page objects.
 * Intentionally minimal: navigation and infrastructure concerns live in the fixture layer,
 * keeping page objects focused on UI locators and actions.
 */
export class BasePage {
  constructor(readonly page: Page) {}
}
