/* oxlint-disable no-console */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { emitTypeScript as emitIds } from "./lib/emit-ids.js";
import { emitTypeScript as emitIdentifiers } from "./lib/emit-identifiers.js";
import { dim, green, red } from "./lib/format.js";
import { GENERATED_IDS_PATH, fetchIdsJava, parseIdsJava } from "./lib/parse-ids.js";
import { GENERATED_IDENTIFIERS_PATH, fetchIdentifiersJava, parseIdentifiersJava } from "./lib/parse-identifiers.js";

function regenerateAndCheck(label: string, output: string, outputPath: string, syncCommand: string): boolean {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf-8");
  execFileSync("pnpm", ["exec", "prettier", "--write", outputPath], { stdio: "ignore" });

  try {
    execFileSync("git", ["diff", "--exit-code", outputPath], { stdio: "pipe" });
    console.log(green(`  ✓ ${label} in sync with upstream`));
    return true;
  } catch {
    console.error("");
    execFileSync("git", ["diff", outputPath], { stdio: "inherit" });
    console.error("");
    console.error(red(`  ✗ ${label} are out of sync with upstream`));
    console.error(`    ${dim("↳")} ${dim("Run")} ${syncCommand} ${dim("locally and commit the result")}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("Checking sync…");

  console.log(`  ${dim("Fetching OuiaIds.java from GitHub…")}`);
  const idsSource = await fetchIdsJava();
  const idsParsed = parseIdsJava(idsSource);
  const idsOutput = emitIds(idsParsed);

  console.log(`  ${dim("Fetching Identifiers.java from GitHub…")}`);
  const identifiersSource = await fetchIdentifiersJava();
  const identifiersParsed = parseIdentifiersJava(identifiersSource);
  const identifiersOutput = emitIdentifiers(identifiersParsed);

  const idsOk = regenerateAndCheck("OUIA IDs", idsOutput, resolve(GENERATED_IDS_PATH), "pnpm sync:ouia");
  const identifiersOk = regenerateAndCheck(
    "Identifiers",
    identifiersOutput,
    resolve(GENERATED_IDENTIFIERS_PATH),
    "pnpm sync:identifiers",
  );

  if (!idsOk || !identifiersOk) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
