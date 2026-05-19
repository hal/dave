import type { Locator, Page } from "@playwright/test";
import { BasePage, MAIN_CONTENT_ID } from "./base.page.js";

const NAV_ITEMS = ["Dashboard", "Deployments", "Tasks", "Configuration", "Runtime", "Management model"] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

export class NavigationPage extends BasePage {
  constructor(page: Page, managementUrl: string) {
    super(page, managementUrl);
  }

  link(item: NavItem): Locator {
    return this.page.getByRole("link", { name: item });
  }

  async navigateTo(item: NavItem): Promise<void> {
    await this.link(item).click();
    await this.page.locator(MAIN_CONTENT_ID).waitFor({ state: "visible" });
  }
}

export { NAV_ITEMS };
