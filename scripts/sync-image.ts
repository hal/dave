/* eslint-disable no-console */
import { spawn } from "node:child_process";

import { detectRuntime } from "../src/utils/container-runtime.js";

const IMAGE = "quay.io/halconsole/hal-op:test-suite";

async function main(): Promise<void> {
  const runtime = await detectRuntime();
  console.log(`Pulling ${IMAGE} using ${runtime}...`);

  const child = spawn(runtime, ["pull", IMAGE], { stdio: "inherit" });
  const exitCode = await new Promise<number>((resolve) => {
    child.on("close", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    console.error(`Pull failed with exit code ${exitCode}`);
    process.exit(exitCode);
  }
  console.log("Image pulled successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
