import { test as base } from "@playwright/test";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
  type WildFlyContainer,
} from "../utils/wildfly-container.js";

const CONTAINER_SETUP_TIMEOUT_MS = 180_000;

/** Worker-scoped fixtures — one WildFly container per spec file per browser project. */
interface WildFlyWorkerFixtures {
  specPath: string;
  wildfly: WildFlyContainer;
}

/** Base test object with WildFly container lifecycle. */
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
});

export { test, expect } from "@playwright/test";
