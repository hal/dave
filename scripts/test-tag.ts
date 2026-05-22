/* eslint-disable no-console */
import { execFileSync } from "node:child_process";
import { Tag } from "../src/tags.js";
import { green, red, dim } from "./lib/format.js";

const tagEntries = Object.values(Tag);
const tagNames = tagEntries.map((t) => t.value.replace("@", ""));

function printUsage(): void {
  console.log("\nUsage: pnpm test:tag <name> [name...] [-- playwright-options]\n");
  console.log("Available tags:\n");
  for (const tag of tagEntries) {
    const name = tag.value.replace("@", "");
    console.log(`  ${green(name.padEnd(20))} ${dim(tag.description)}`);
  }
  console.log(`\nExamples:`);
  console.log(`  pnpm test:tag smoke`);
  console.log(`  pnpm test:tag smoke dashboard`);
  console.log(`  pnpm test:tag smoke -- --project=chromium\n`);
}

const rawArgs = process.argv.slice(2);
const separatorIndex = rawArgs.indexOf("--");
const names = separatorIndex === -1 ? rawArgs : rawArgs.slice(0, separatorIndex);
const extraArgs = separatorIndex === -1 ? [] : rawArgs.slice(separatorIndex + 1);

if (names.length === 0) {
  printUsage();
  process.exit(0);
}

const invalid = names.filter((n) => !tagNames.includes(n));
if (invalid.length > 0) {
  console.error(red(`Unknown tag(s): ${invalid.map((n) => `"${n}"`).join(", ")}`));
  printUsage();
  process.exit(1);
}

const grepPattern = names.map((n) => `@${n}`).join("|");
const args = ["exec", "playwright", "test", "--grep", grepPattern, ...extraArgs];

try {
  execFileSync("pnpm", args, { stdio: "inherit" });
} catch {
  process.exit(1);
}
