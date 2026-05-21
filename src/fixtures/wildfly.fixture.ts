import { readFileSync } from "node:fs";
import { test as base } from "@playwright/test";
import { STATE_FILE, type DaveState } from "../../global-setup.js";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
  type WildFlyContainer,
} from "../utils/wildfly-container.js";

const CONTAINER_SETUP_TIMEOUT_MS = 180_000;

function readNetworkName(): string | undefined {
  try {
    const state: DaveState = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    return state.networkName;
  } catch {
    return undefined;
  }
}

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
      const networkName = readNetworkName();
      const wildfly = await startWildFlyContainer(name, networkName);
      await use(wildfly);
      await stopWildFlyContainer(wildfly);
    },
    { scope: "worker", timeout: CONTAINER_SETUP_TIMEOUT_MS },
  ],
});

export { test, expect } from "@playwright/test";
