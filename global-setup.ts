/* eslint-disable no-console */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FullConfig } from "@playwright/test";
import { GenericContainer, Network, type StartedNetwork } from "testcontainers";
import "./src/utils/configure-testcontainers.js";
import { detectRuntime, execFileAsync } from "./src/utils/container-runtime.js";

export interface HalOpInstance {
  readonly containerId: string;
  readonly port: number;
}

export interface DaveState {
  readonly halop: HalOpInstance;
  readonly networkName: string;
  readonly networkId: string;
}

const STATE_FILE = join(tmpdir(), "dave-state.json");
const DEFAULT_HALOP_IMAGE = "quay.io/halconsole/hal-op:test-suite";
const DEFAULT_HALOP_PORT = 9090;
const CONTAINER_INTERNAL_PORT = 9090;
const CONTAINER_NAME = "dave_halop";
const CONTAINER_PREFIX = "dave_";

export { STATE_FILE };

async function createNetwork(): Promise<StartedNetwork> {
  return new Network().start();
}

async function startHalOp(image: string, port: number, network: StartedNetwork): Promise<HalOpInstance> {
  const container = await new GenericContainer(image)
    .withName(CONTAINER_NAME)
    .withNetwork(network)
    .withExposedPorts({ container: CONTAINER_INTERNAL_PORT, host: port })
    .start();
  return {
    containerId: container.getId(),
    port: container.getMappedPort(CONTAINER_INTERNAL_PORT),
  };
}

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

  console.log("Creating shared network...");
  const network = await createNetwork();
  const networkName = network.getName();
  const networkId = network.getId();
  console.log(`Network "${networkName}" created`);

  const halopImage = process.env.HALOP_IMAGE ?? DEFAULT_HALOP_IMAGE;
  const halopPortRaw = process.env.HALOP_PORT ?? DEFAULT_HALOP_PORT;
  const halopPort = Number(halopPortRaw);
  if (Number.isNaN(halopPort)) {
    throw new Error(`Invalid HALOP_PORT: "${halopPortRaw}" is not a number`);
  }

  console.log(`Starting halOP from "${halopImage}" on port ${halopPort}...`);
  const halop = await startHalOp(halopImage, halopPort, network);
  console.log(`halOP started (container: ${halop.containerId.slice(0, 12)})`);

  const state: DaveState = { halop, networkName, networkId };
  writeFileSync(STATE_FILE, JSON.stringify(state));

  process.env.HALOP_URL = `http://localhost:${halop.port}`;
}

export default globalSetup;
