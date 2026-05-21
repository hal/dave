/* eslint-disable no-console */
import { resolve } from "node:path";

import { execFileAsync } from "../src/utils/container-runtime.js";
import { GENERATED_IDS_PATH, fetchIdsJava, parseIdsJava, readLocalConstants } from "./lib/parse-ids.js";
import { dim, green, red, yellow } from "./lib/format.js";
import { requireCommands, requireContainerRuntime } from "./lib/preflight.js";

const IMAGE = "quay.io/halconsole/hal-op:test-suite";
const QUAY_API_URL = "https://quay.io/api/v1/repository/halconsole/hal-op/tag/?specificTag=test-suite";

interface StatusResult {
  readonly label: string;
  readonly ok: boolean;
  readonly message: string;
  readonly action?: string;
}

// ------------------------------------------------------ OUIA IDs

async function checkOuiaIds(): Promise<StatusResult> {
  try {
    const source = await fetchIdsJava();
    const parsed = parseIdsJava(source);
    const localConstants = readLocalConstants(resolve(GENERATED_IDS_PATH));

    const remoteNames = new Set(parsed.constants.map((c) => c.name));
    const localSet = new Set(localConstants);

    const added = parsed.constants.filter((c) => !localSet.has(c.name));
    const removed = localConstants.filter((name) => !remoteNames.has(name));

    if (added.length === 0 && removed.length === 0) {
      return { label: "OUIA IDs", ok: true, message: "In sync with upstream" };
    }

    const parts: string[] = [];
    if (added.length > 0) parts.push(`${added.length} new: ${added.map((c) => c.name).join(", ")}`);
    if (removed.length > 0) parts.push(`${removed.length} removed: ${removed.join(", ")}`);

    return {
      label: "OUIA IDs",
      ok: false,
      message: `Out of sync (${parts.join("; ")})`,
      action: "pnpm sync:ouia",
    };
  } catch (err) {
    return {
      label: "OUIA IDs",
      ok: false,
      message: `Failed to check: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ------------------------------------------------------ CI build

interface WorkflowRun {
  readonly status: string;
  readonly conclusion: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly html_url: string;
}

async function checkCiBuild(): Promise<StatusResult> {
  try {
    const { stdout } = await execFileAsync("gh", [
      "api",
      "repos/hal/foundation/actions/workflows/test-suite.yml/runs",
      "--jq",
      ".workflow_runs[0] | {status, conclusion, created_at, updated_at, html_url}",
    ]);

    const run: WorkflowRun = JSON.parse(stdout.trim());

    if (run.status === "completed" && run.conclusion === "success") {
      const updated = new Date(run.updated_at);
      const ago = formatTimeAgo(updated);
      return {
        label: "CI build",
        ok: true,
        message: `Succeeded ${ago} (${run.html_url})`,
      };
    }

    if (run.status === "in_progress" || run.status === "queued") {
      return {
        label: "CI build",
        ok: false,
        message: `${run.status === "in_progress" ? "In progress" : "Queued"} (${run.html_url})`,
        action: "Wait for build to complete",
      };
    }

    return {
      label: "CI build",
      ok: false,
      message: `${run.conclusion ?? run.status} (${run.html_url})`,
    };
  } catch {
    return {
      label: "CI build",
      ok: false,
      message: "Failed to check (is gh CLI authenticated?)",
    };
  }
}

// ------------------------------------------------------ container image

interface QuayTag {
  readonly manifest_digest: string;
  readonly last_modified: string;
}

interface QuayResponse {
  readonly tags: readonly QuayTag[];
}

async function checkContainerImage(runtime: "podman" | "docker"): Promise<StatusResult> {
  // RepoDigests contains both the manifest-list and platform-specific digests
  const repoDigests = await execFileAsync(runtime, [
    "image",
    "inspect",
    IMAGE,
    "--format",
    "{{range .RepoDigests}}{{.}}\n{{end}}",
  ])
    .then(({ stdout }) =>
      stdout
        .trim()
        .split("\n")
        .filter((l) => l.length > 0),
    )
    .catch(() => null);
  if (repoDigests === null || repoDigests.length === 0) {
    return {
      label: "Container image",
      ok: false,
      message: "Not found locally",
      action: "pnpm sync:image",
    };
  }

  try {
    const response = await fetch(QUAY_API_URL);
    if (!response.ok) {
      return {
        label: "Container image",
        ok: false,
        message: `Failed to check remote: ${response.status}`,
      };
    }

    const data: QuayResponse = (await response.json()) as QuayResponse;
    if (data.tags.length === 0) {
      return {
        label: "Container image",
        ok: false,
        message: "No remote tag found",
      };
    }

    const remoteDigest = data.tags[0].manifest_digest;
    const remoteModified = data.tags[0].last_modified;

    // Check if any local RepoDigest ends with the remote manifest digest
    const matches = repoDigests.some((rd) => rd.endsWith(remoteDigest));
    if (matches) {
      return {
        label: "Container image",
        ok: true,
        message: `Up to date (pushed ${remoteModified})`,
      };
    }

    return {
      label: "Container image",
      ok: false,
      message: `Stale (local digest differs from remote, pushed ${remoteModified})`,
      action: "pnpm sync:image",
    };
  } catch (err) {
    return {
      label: "Container image",
      ok: false,
      message: `Failed to check remote: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ------------------------------------------------------ output

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function printResult(result: StatusResult): void {
  const icon = result.ok ? green("✓") : red("✗");
  const message = result.ok ? result.message : red(result.message);
  console.log(`  ${icon} ${result.label}: ${message}`);
  if (result.action) {
    console.log(`    ${dim("↳")} ${dim(result.action)}`);
  }
}

// ------------------------------------------------------ main

async function main(): Promise<void> {
  await requireCommands("gh");
  const runtime = await requireContainerRuntime();

  console.log("Checking sync status…\n");

  const results = await Promise.all([checkOuiaIds(), checkCiBuild(), checkContainerImage(runtime)]);

  for (const result of results) {
    printResult(result);
  }

  const allOk = results.every((r) => r.ok);
  console.log("");
  if (allOk) {
    console.log(green("✓ Ready to test."));
  } else {
    console.log(yellow("⚠ Action required — see suggestions above."));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
