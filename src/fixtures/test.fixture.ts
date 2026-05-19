import { test as base } from "@playwright/test";
import { BasePage, MAIN_CONTENT_ID } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { EndpointPage } from "../pages/endpoint.page.js";
import { NavigationPage } from "../pages/navigation.page.js";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
  type WildFlyContainer,
} from "../utils/wildfly-container.js";

const DEBUG = !!process.env.DEBUG;
const CONTAINER_SETUP_TIMEOUT_MS = 180_000;

let currentWildFly: WildFlyContainer | undefined;

export function setWildFly(wildfly: WildFlyContainer): void {
  currentWildFly = wildfly;
}

export function clearWildFly(): void {
  currentWildFly = undefined;
}

export function useWildFlyContainer(testInstance: typeof test, specPath: string): void {
  let wildfly: WildFlyContainer | undefined;

  testInstance.beforeAll(async () => {
    testInstance.setTimeout(CONTAINER_SETUP_TIMEOUT_MS);
    wildfly = await startWildFlyContainer(containerNameFromSpec(specPath));
    setWildFly(wildfly);
  });

  testInstance.afterAll(async () => {
    clearWildFly();
    if (wildfly) {
      await stopWildFlyContainer(wildfly);
    }
  });
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
      throw new Error("No WildFly container running. Call useWildFlyContainer() before your tests.");
    }
    const basePage = new BasePage(page);
    if (DEBUG) {
      /* eslint-disable no-console */
      page.on("response", (response) => {
        if (response.status() >= 400) {
          console.log(`HTTP ${response.status()}: ${response.url()}`);
        }
      });
      page.on("pageerror", (err) => console.log(`PAGE ERROR: ${err.message}`));
      /* eslint-enable no-console */
    }
    await page.goto("/");
    await basePage.enableOuia();
    const url = `/?connect=${currentWildFly.managementUrl}`;
    if (DEBUG) {
      console.log(`connectedPage: navigating to ${url}`); // eslint-disable-line no-console
    }
    await page.goto(url);
    await page.locator(MAIN_CONTENT_ID).waitFor({ state: "visible", timeout: 30_000 });
    await use(basePage);
  },
});

export { expect } from "@playwright/test";
