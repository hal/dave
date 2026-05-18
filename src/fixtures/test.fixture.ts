import { test as base } from "@playwright/test";
import { BasePage } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { EndpointPage } from "../pages/endpoint.page.js";
import { NavigationPage } from "../pages/navigation.page.js";
import type { WildFlyContainer } from "../utils/wildfly-container.js";

let currentWildFly: WildFlyContainer | undefined;

export function setWildFly(wildfly: WildFlyContainer): void {
  currentWildFly = wildfly;
}

export function clearWildFly(): void {
  currentWildFly = undefined;
}

interface DaveFixtures {
  basePage: BasePage;
  dashboardPage: DashboardPage;
  endpointPage: EndpointPage;
  navigationPage: NavigationPage;
  connectedPage: BasePage;
}

export const test = base.extend<DaveFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  endpointPage: async ({ page }, use) => {
    await use(new EndpointPage(page));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },

  connectedPage: async ({ page }, use) => {
    if (!currentWildFly) {
      throw new Error(
        "No WildFly container running. Call startWildFlyContainer() in test.beforeAll().",
      );
    }
    const basePage = new BasePage(page);
    page.on("response", (response) => {
      if (response.status() >= 400) {
        console.log(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
    page.on("pageerror", (err) => console.log(`PAGE ERROR: ${err.message}`));
    await page.goto("/");
    await basePage.enableOuia();
    const url = `/?connect=${currentWildFly.managementUrl}`;
    console.log(`connectedPage: navigating to ${url}`);
    await page.goto(url);
    await page.waitForTimeout(8000);
    await basePage.waitForConsoleReady();
    await use(basePage);
  },
});

export { expect } from "@playwright/test";
