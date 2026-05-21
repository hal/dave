/* eslint-disable no-console */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { red } from "./format.js";

const execFileAsync = promisify(execFile);

async function isAvailable(binary: string): Promise<boolean> {
  try {
    await execFileAsync(binary, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function requireCommands(...commands: readonly string[]): Promise<void> {
  const results = await Promise.all(commands.map(async (cmd) => ({ cmd, ok: await isAvailable(cmd) })));
  const missing = results.filter((r) => !r.ok).map((r) => r.cmd);
  if (missing.length > 0) {
    console.error(red(`✗ Missing required command${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`));
    console.error("  Please install them before running this script.");
    process.exit(1);
  }
}

export async function requireContainerRuntime(): Promise<"podman" | "docker"> {
  if (await isAvailable("podman")) return "podman";
  if (await isAvailable("docker")) return "docker";
  console.error(red("✗ No container runtime found."));
  console.error("  Install podman or docker before running this script.");
  process.exit(1);
}
