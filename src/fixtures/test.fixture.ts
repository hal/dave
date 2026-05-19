import { test as base } from "@playwright/test";
import { BasePage } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { NavigationPage } from "../pages/navigation.page.js";
import { requireManagementUrl } from "./wildfly.fixture.js";

interface DaveFixtures {
  basePage: BasePage;
  dashboardPage: DashboardPage;
  navigationPage: NavigationPage;
}

export const test = base.extend<DaveFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page, requireManagementUrl()));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page, requireManagementUrl()));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page, requireManagementUrl()));
  },
});

export { expect } from "@playwright/test";
export { useWildFlyContainer } from "./wildfly.fixture.js";
