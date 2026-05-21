import { test as base, type Page } from "@playwright/test";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
  type WildFlyContainer,
} from "../utils/wildfly-container.js";

const CONTAINER_SETUP_TIMEOUT_MS = 180_000;

async function enableOuia(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("ouia", "true");
  });
}

/** Worker-scoped fixtures — one WildFly container per spec file per browser project. */
interface WildFlyWorkerFixtures {
  // Identifies the spec file for container naming (e.g. "smoke/dashboard").
  // Set via test.use({ specPath: "..." }) in each spec that needs WildFly.
  specPath: string;
  wildfly: WildFlyContainer;
}

/** Base test object with WildFly container lifecycle and OUIA enablement. */
export const testWithWildFly = base.extend<object, WildFlyWorkerFixtures>({
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

  // Override built-in page fixture to enable OUIA for every test automatically
  page: async ({ page }, use) => {
    await enableOuia(page);
    await use(page);
  },
});

export { test, expect } from "@playwright/test";
