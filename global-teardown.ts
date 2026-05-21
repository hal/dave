/* eslint-disable no-console */
import { readFileSync, unlinkSync } from "node:fs";
import type { FullConfig } from "@playwright/test";
import "./src/utils/configure-testcontainers.js";
import { detectRuntime, execFileAsync } from "./src/utils/container-runtime.js";
import { STATE_FILE, type DaveState } from "./global-setup.js";

async function stopContainer(containerId: string): Promise<void> {
  const runtime = await detectRuntime();
  try {
    await execFileAsync(runtime, ["stop", containerId]);
  } catch {
    // container already stopped
  }
  try {
    await execFileAsync(runtime, ["rm", "-f", containerId]);
  } catch {
    // container already removed
  }
}

async function removeNetwork(networkId: string): Promise<void> {
  const runtime = await detectRuntime();
  try {
    await execFileAsync(runtime, ["network", "rm", networkId]);
  } catch {
    // network already removed
  }
}

async function globalTeardown(_config: FullConfig): Promise<void> {
  let state: DaveState;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    console.warn("No dave state file found — skipping teardown");
    return;
  }

  console.log("Stopping halOP...");
  try {
    await stopContainer(state.halop.containerId);
    console.log("halOP stopped");
  } catch (error) {
    console.error("Failed to stop halOP:", error);
  }

  if (state.networkId) {
    await removeNetwork(state.networkId);
    console.log(`Network "${state.networkName}" removed`);
  }

  try {
    unlinkSync(STATE_FILE);
  } catch {
    // state file already cleaned up
  }
}

export default globalTeardown;
