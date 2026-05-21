/* eslint-disable no-console */
import { readFileSync, unlinkSync } from "node:fs";
import type { FullConfig } from "@playwright/test";
import { detectRuntime, execFileAsync } from "./src/utils/container-runtime.js";
import { STATE_FILE, type DaveState } from "./global-setup.js";

async function stopHalOp(containerId: string): Promise<void> {
  const runtime = await detectRuntime();
  await execFileAsync(runtime, ["stop", containerId]);
  await execFileAsync(runtime, ["rm", containerId]);
}

async function removeNetwork(networkName: string): Promise<void> {
  const runtime = await detectRuntime();
  await execFileAsync(runtime, ["network", "rm", networkName]);
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
    await stopHalOp(state.halop.containerId);
    console.log("halOP stopped");
  } catch (error) {
    console.error("Failed to stop halOP:", error);
  }

  if (state.networkName) {
    try {
      await removeNetwork(state.networkName);
      console.log(`Network "${state.networkName}" removed`);
    } catch {
      // network already removed or didn't exist
    }
  }

  try {
    unlinkSync(STATE_FILE);
  } catch {
    // state file already cleaned up
  }
}

export default globalTeardown;
