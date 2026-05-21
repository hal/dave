import { testWithWildFly } from "./wildfly.fixture.js";
import { BasePage } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { ModelBrowserPage } from "../pages/model-browser.page.js";
import { NavigationPage } from "../pages/navigation.page.js";

/** Test-scoped page object fixtures. */
interface PageFixtures {
  basePage: BasePage;
  dashboardPage: DashboardPage;
  modelBrowserPage: ModelBrowserPage;
  navigationPage: NavigationPage;
}

/** Test object with WildFly container and page object fixtures. */
export const test = testWithWildFly.extend<PageFixtures>({
  basePage: async ({ page, wildfly }, use) => {
    const basePage = new BasePage(page);
    await basePage.open(wildfly.managementUrl);
    await use(basePage);
  },

  dashboardPage: async ({ page, wildfly }, use) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.open(wildfly.managementUrl);
    await use(dashboardPage);
  },

  modelBrowserPage: async ({ page, wildfly }, use) => {
    const modelBrowserPage = new ModelBrowserPage(page);
    await modelBrowserPage.open(wildfly.managementUrl);
    await use(modelBrowserPage);
  },

  navigationPage: async ({ page, wildfly }, use) => {
    const navigationPage = new NavigationPage(page);
    await navigationPage.open(wildfly.managementUrl);
    await use(navigationPage);
  },
});

export { expect } from "@playwright/test";
