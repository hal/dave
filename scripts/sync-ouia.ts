/* eslint-disable no-console */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { emitTypeScript } from "./lib/emit-ids.js";
import { GENERATED_IDS_PATH, fetchIdsJava, parseIdsJava, readLocalConstants } from "./lib/parse-ids.js";
import { dim, green, red } from "./lib/format.js";

// ------------------------------------------------------ main

async function main(): Promise<void> {
  console.log("Fetching Ids.java from GitHub...");
  const source = await fetchIdsJava();
  const parsed = parseIdsJava(source);

  const outputPath = resolve(GENERATED_IDS_PATH);
  const existingConstants = readLocalConstants(outputPath);
  const newConstantNames = new Set(parsed.constants.map((c) => c.name));
  const existingSet = new Set(existingConstants);

  const added = parsed.constants.filter((c) => !existingSet.has(c.name));
  const removed = existingConstants.filter((name) => !newConstantNames.has(name));
  const unchanged = existingConstants.filter((name) => newConstantNames.has(name));

  const output = emitTypeScript(parsed);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf-8");
  execFileSync("pnpm", ["exec", "prettier", "--write", outputPath], { stdio: "ignore" });

  console.log(`Generated ${dim(outputPath)}`);
  console.log(`  ${parsed.constants.length} constants, ${parsed.methods.length} functions`);
  if (added.length > 0) {
    console.log(green(`  + ${added.length} added: ${added.map((c) => c.name).join(", ")}`));
  }
  if (removed.length > 0) {
    console.log(red(`  - ${removed.length} removed: ${removed.join(", ")}`));
  }
  if (unchanged.length > 0 && added.length === 0 && removed.length === 0) {
    console.log(green("  ✓ No changes"));
  }
}

main().catch((err) => {
  console.error(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
