import { execFile } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { promisify } from "node:util";
import type { FullConfig } from "@playwright/test";
import { detectRuntime } from "./src/utils/container-runtime.js";
import { STATE_FILE, type DaveState } from "./global-setup.js";

const execFileAsync = promisify(execFile);

async function stopHalOp(containerId: string): Promise<void> {
  const runtime = await detectRuntime();
  await execFileAsync(runtime, ["stop", containerId]);
  await execFileAsync(runtime, ["rm", containerId]);
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

  try {
    unlinkSync(STATE_FILE);
  } catch {
    // state file already cleaned up
  }
}

export default globalTeardown;
