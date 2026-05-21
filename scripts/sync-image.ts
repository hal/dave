/* eslint-disable no-console */
import { spawn } from "node:child_process";

import { green, red } from "./lib/format.js";
import { requireContainerRuntime } from "./lib/preflight.js";

const IMAGE = "quay.io/halconsole/hal-op:test-suite";

async function main(): Promise<void> {
  const runtime = await requireContainerRuntime();
  console.log(`Pulling ${IMAGE} using ${runtime}…`);

  const child = spawn(runtime, ["pull", IMAGE], { stdio: "inherit" });
  const exitCode = await new Promise<number>((resolve) => {
    child.on("close", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    console.error(red(`✗ Pull failed with exit code ${exitCode}`));
    process.exit(exitCode);
  }
  console.log(green("✓ Image pulled successfully."));
}

main().catch((err) => {
  console.error(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
