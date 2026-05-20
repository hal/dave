import { test as base } from "@playwright/test";
import { BasePage } from "../pages/base.page.js";
import { DashboardPage } from "../pages/dashboard.page.js";
import { ModelBrowserPage } from "../pages/model-browser.page.js";
import { NavigationPage } from "../pages/navigation.page.js";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
  type WildFlyContainer,
} from "../utils/wildfly-container.js";

const CONTAINER_SETUP_TIMEOUT_MS = 180_000;

interface DaveFixtures {
  basePage: BasePage;
  dashboardPage: DashboardPage;
  modelBrowserPage: ModelBrowserPage;
  navigationPage: NavigationPage;
}

interface DaveWorkerFixtures {
  // Identifies the spec file for container naming (e.g. "smoke/dashboard").
  // Set via test.use({ specPath: "..." }) in each spec that needs WildFly.
  specPath: string;
  wildfly: WildFlyContainer;
}

export const testWithWildFly = base.extend<DaveFixtures, DaveWorkerFixtures>({
  specPath: ["", { scope: "worker", option: true }],

  wildfly: [
    async ({ specPath }, use, workerInfo) => {
      const name = containerNameFromSpec(specPath, workerInfo.project.name);
      const wildfly = await startWildFlyContainer(name);
      await use(wildfly);
      await stopWildFlyContainer(wildfly);
    },
    { scope: "worker", timeout: CONTAINER_SETUP_TIMEOUT_MS },
  ],

  basePage: async ({ page, wildfly }, use) => {
    await use(new BasePage(page, wildfly.managementUrl));
  },

  dashboardPage: async ({ page, wildfly }, use) => {
    await use(new DashboardPage(page, wildfly.managementUrl));
  },

  modelBrowserPage: async ({ page, wildfly }, use) => {
    await use(new ModelBrowserPage(page, wildfly.managementUrl));
  },

  navigationPage: async ({ page, wildfly }, use) => {
    await use(new NavigationPage(page, wildfly.managementUrl));
  },
});

export { test, expect } from "@playwright/test";
