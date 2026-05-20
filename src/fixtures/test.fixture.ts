import { test as base } from "@playwright/test";
import { label, LabelName } from "allure-js-commons";
import { BasePage } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { ModelBrowserPage } from "../pages/model-browser.page.js";
import { NavigationPage } from "../pages/navigation.page.js";
import { requireManagementUrl } from "./wildfly.fixture.js";

interface DaveFixtures {
  basePage: BasePage;
  dashboardPage: DashboardPage;
  modelBrowserPage: ModelBrowserPage;
  navigationPage: NavigationPage;
}

export const test = base.extend<DaveFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page, requireManagementUrl()));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page, requireManagementUrl()));
  },

  modelBrowserPage: async ({ page }, use) => {
    await use(new ModelBrowserPage(page, requireManagementUrl()));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page, requireManagementUrl()));
  },
});

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
  await label(LabelName.TAG, testInfo.project.name);
});

export { expect } from "@playwright/test";
export { useWildFlyContainer } from "./wildfly.fixture.js";
