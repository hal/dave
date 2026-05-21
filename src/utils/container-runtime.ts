import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const execFileAsync = promisify(execFile);

/** Supported container runtimes for halOP global setup/teardown. */
export type ContainerRuntime = "podman" | "docker";

async function isAvailable(binary: string): Promise<boolean> {
  try {
    await execFileAsync(binary, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

async function resolveRuntime(): Promise<ContainerRuntime> {
  const dockerHost = process.env.DOCKER_HOST ?? "";
  if (dockerHost.includes("podman") && (await isAvailable("podman"))) {
    return "podman";
  }
  if (await isAvailable("docker")) {
    return "docker";
  }
  if (await isAvailable("podman")) {
    return "podman";
  }
  throw new Error("No container runtime found. Install podman or docker.");
}

let detection: Promise<ContainerRuntime> | undefined;

/** Detects and caches the available container runtime. Prefers the runtime matching DOCKER_HOST. */
export function detectRuntime(): Promise<ContainerRuntime> {
  detection ??= resolveRuntime();
  return detection;
}
