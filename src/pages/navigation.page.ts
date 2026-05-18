import type { Locator, Page } from "@playwright/test";

const NAV_ITEMS = [
  "Dashboard",
  "Deployments",
  "Tasks",
  "Configuration",
  "Runtime",
  "Management model",
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

export class NavigationPage {
  constructor(readonly page: Page) {}

  link(item: NavItem): Locator {
    return this.page.getByRole("link", { name: item });
  }

  async navigateTo(item: NavItem): Promise<void> {
    await this.link(item).click();
    await this.page.locator("#hal-main-id").waitFor({ state: "visible" });
  }
}

export { NAV_ITEMS };
