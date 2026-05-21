import type { Page } from "@playwright/test";
import { testWithWildFly } from "./wildfly.fixture.js";
import { MAIN_ID } from "@halconsole/ouia";
import { BasePage } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { ModelBrowserPage } from "../pages/model-browser.page.js";
import { NavigationPage } from "../pages/navigation.page.js";

async function enableOuia(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("ouia", "true");
  });
}

/** Navigates to halOP with the WildFly connect parameter and waits for the main content. */
async function openHalOp(page: Page, managementUrl: string): Promise<void> {
  await page.goto(`/?connect=${managementUrl}`);
  await page.locator(`#${MAIN_ID}`).waitFor({ state: "visible" });
}

/** Test-scoped page object fixtures. */
interface PageFixtures {
  basePage: BasePage;
  dashboardPage: DashboardPage;
  modelBrowserPage: ModelBrowserPage;
  navigationPage: NavigationPage;
}

/** Test object with WildFly container, OUIA enablement, and page object fixtures. */
export const test = testWithWildFly.extend<PageFixtures>({
  page: async ({ page }, use) => {
    await enableOuia(page);
    await use(page);
  },

  basePage: async ({ page, wildfly }, use) => {
    await openHalOp(page, wildfly.managementUrl);
    await use(new BasePage(page));
  },

  dashboardPage: async ({ page, wildfly }, use) => {
    await openHalOp(page, wildfly.managementUrl);
    await use(new DashboardPage(page));
  },

  modelBrowserPage: async ({ page, wildfly }, use) => {
    await openHalOp(page, wildfly.managementUrl);
    const modelBrowserPage = new ModelBrowserPage(page);
    await modelBrowserPage.navigate();
    await use(modelBrowserPage);
  },

  navigationPage: async ({ page, wildfly }, use) => {
    await openHalOp(page, wildfly.managementUrl);
    await use(new NavigationPage(page));
  },
});

export { expect } from "@playwright/test";
