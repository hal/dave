/* eslint-disable no-console */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { emitTypeScript } from "./lib/emit-ids.js";
import { dim, green, red } from "./lib/format.js";
import { GENERATED_IDS_PATH, fetchIdsJava, parseIdsJava } from "./lib/parse-ids.js";

async function main(): Promise<void> {
  const outputPath = resolve(GENERATED_IDS_PATH);

  console.log("Checking OUIA ID sync…");
  console.log(`  ${dim("Fetching OuiaIds.java from GitHub…")}`);
  const source = await fetchIdsJava();
  const parsed = parseIdsJava(source);
  const output = emitTypeScript(parsed);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf-8");
  execFileSync("pnpm", ["exec", "prettier", "--write", outputPath], { stdio: "ignore" });

  try {
    execFileSync("git", ["diff", "--exit-code", outputPath], { stdio: "pipe" });
    console.log(green("  ✓ OUIA IDs in sync with upstream"));
  } catch {
    console.error("");
    execFileSync("git", ["diff", outputPath], { stdio: "inherit" });
    console.error("");
    console.error(red("  ✗ OUIA IDs are out of sync with upstream OuiaIds.java"));
    console.error(`    ${dim("↳")} ${dim("Run")} pnpm sync:ouia ${dim("locally and commit the result")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
