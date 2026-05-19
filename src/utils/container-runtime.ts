import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const execFileAsync = promisify(execFile);

export type ContainerRuntime = "podman" | "docker";

let cached: ContainerRuntime | undefined;

async function isAvailable(binary: string): Promise<boolean> {
  try {
    await execFileAsync(binary, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function detectRuntime(): Promise<ContainerRuntime> {
  if (cached) {
    return cached;
  }

  if (await isAvailable("podman")) {
    cached = "podman";
  } else if (await isAvailable("docker")) {
    cached = "docker";
  } else {
    throw new Error("No container runtime found. Install podman or docker.");
  }

  return cached;
}
