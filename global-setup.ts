/* eslint-disable no-console */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FullConfig } from "@playwright/test";
import { detectRuntime, execFileAsync } from "./src/utils/container-runtime.js";

export interface HalOpInstance {
  readonly containerId: string;
  readonly port: number;
}

export interface DaveState {
  readonly halop: HalOpInstance;
}

const STATE_FILE = join(tmpdir(), "dave-state.json");
const DEFAULT_HALOP_IMAGE = "quay.io/halconsole/hal-op:test-suite";
const DEFAULT_HALOP_PORT = 9090;
const CONTAINER_INTERNAL_PORT = 9090;
const CONTAINER_NAME = "dave_halop";

export { STATE_FILE };

async function startHalOp(image: string, port: number): Promise<HalOpInstance> {
  const runtime = await detectRuntime();
  const { stdout } = await execFileAsync(runtime, [
    "run",
    "-d",
    "--name",
    CONTAINER_NAME,
    "-p",
    `${port}:${CONTAINER_INTERNAL_PORT}`,
    image,
  ]);
  const containerId = stdout.trim();
  if (!containerId) {
    throw new Error(`${runtime} run returned no container ID for image "${image}"`);
  }
  return { containerId, port };
}

const CONTAINER_PREFIX = "dave_";

async function removeStaleContainers(): Promise<void> {
  const runtime = await detectRuntime();
  try {
    const { stdout } = await execFileAsync(runtime, [
      "ps",
      "-a",
      "--filter",
      `name=^${CONTAINER_PREFIX}`,
      "--format",
      "{{.Names}}",
    ]);
    const names = stdout
      .trim()
      .split("\n")
      .filter((n) => n.length > 0);
    for (const name of names) {
      console.log(`Removing stale container: ${name}`);
      await execFileAsync(runtime, ["rm", "-f", name]);
    }
  } catch {
    // No stale containers or runtime not ready yet
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  await removeStaleContainers();

  const halopImage = process.env.HALOP_IMAGE ?? DEFAULT_HALOP_IMAGE;
  const halopPort = Number(process.env.HALOP_PORT ?? DEFAULT_HALOP_PORT);

  console.log(`Starting halOP from "${halopImage}" on port ${halopPort}...`);
  const halop = await startHalOp(halopImage, halopPort);
  console.log(`halOP started (container: ${halop.containerId.slice(0, 12)})`);

  const state: DaveState = { halop };
  writeFileSync(STATE_FILE, JSON.stringify(state));

  process.env.HALOP_URL = `http://localhost:${halop.port}`;
}

export default globalSetup;
