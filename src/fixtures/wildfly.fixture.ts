import type { test as base } from "@playwright/test";
import {
  containerNameFromSpec,
  startWildFlyContainer,
  stopWildFlyContainer,
  type WildFlyContainer,
} from "../utils/wildfly-container.js";

const CONTAINER_SETUP_TIMEOUT_MS = 180_000;

let currentWildFly: WildFlyContainer | undefined;

export function setWildFly(wildfly: WildFlyContainer): void {
  currentWildFly = wildfly;
}

export function clearWildFly(): void {
  currentWildFly = undefined;
}

export function requireManagementUrl(): string {
  if (!currentWildFly) {
    throw new Error("No WildFly container running. Call useWildFlyContainer() before your tests.");
  }
  return currentWildFly.managementUrl;
}

export function useWildFlyContainer(testInstance: typeof base, specPath: string): void {
  let wildfly: WildFlyContainer | undefined;

  testInstance.beforeAll(async (_fixtures, testInfo) => {
    testInstance.setTimeout(CONTAINER_SETUP_TIMEOUT_MS);
    wildfly = await startWildFlyContainer(containerNameFromSpec(specPath, testInfo.project.name));
    setWildFly(wildfly);
  });

  testInstance.afterAll(async () => {
    clearWildFly();
    if (wildfly) {
      await stopWildFlyContainer(wildfly);
    }
  });
}
