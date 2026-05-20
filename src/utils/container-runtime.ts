import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const execFileAsync = promisify(execFile);

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
  if (await isAvailable("podman")) {
    return "podman";
  } else if (await isAvailable("docker")) {
    return "docker";
  }
  throw new Error("No container runtime found. Install podman or docker.");
}

let detection: Promise<ContainerRuntime> | undefined;

export function detectRuntime(): Promise<ContainerRuntime> {
  detection ??= resolveRuntime();
  return detection;
}
