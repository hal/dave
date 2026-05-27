---
name: hal-ouia
description: This skill should be used when the user asks to "add ouia id", "add ouia ids", "missing ouia", "fix selectors", "make testable", "audit selectors", "sync ouia", "ouia status", "check ouia status", or invokes /hal-ouia. Adds missing OUIA IDs to halOP Java source, creates PRs on hal/foundation, and syncs generated constants back to dave.
metadata:
  version: "0.1.0"
---

# /hal-ouia — OUIA ID Management & Upstream Sync

Adds missing OUIA IDs to halOP Java source, creates PRs on `hal/foundation`, monitors CI, and syncs the generated constants back to dave. Closes the loop between discovering missing IDs (via `/hal-explore` or `/hal-spec`) and making elements testable.

## Tools

This skill uses the following tools:

- **Bash** — Execute shell commands for git operations, compilation, CI checks, sync
- **Read** — Read Java source files, configuration, spec files
- **Write** — Create new files (constants, branches)
- **Edit** — Modify existing Java files (add constants, ouiaId calls)
- **Grep** — Search for patterns across halOP and dave codebases
- **Glob** — Find files matching patterns in both repositories
- **AskUserQuestion** — Propose changes for user approval, prompt for foundation path

Browser exploration (Phase 1, interactive mode) uses Chrome DevTools MCP tools:

- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page` — Navigate to halOP pages
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_snapshot` — Capture a11y tree snapshots
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__click` — Interact with UI elements
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot` — Capture visual state

## Arguments

- **(none)** — Interactive mode: browse the live UI (requires `/hal-dev-env`) to find elements missing OUIA IDs
- **Spec file path** (e.g., `src/tests/configuration/configuration.spec.ts`) — Audit an existing test's selectors to find non-OUIA selectors that could be replaced with OUIA IDs
- **Element list** (from `/hal-explore` or `/hal-spec` output) — Targeted mode: add specific missing IDs listed in a gap report
- **`sync`** — Skip to Phase 4: wait for CI and sync dave (use after a PR has been merged)
- **`status`** — Check CI pipeline and container image status without making changes

## Input / Output

**Input:** One of: interactive mode (no args), spec file path (audit selectors), element list (from `/hal-explore` or `/hal-spec` OUIA Coverage section), `sync`, or `status`

**Output:** PR on `hal/foundation` adding OUIA IDs + synced `src/selectors/ids.ts` constants in dave

**Feeds into:** `/hal-spec` — after sync, new OUIA constants are available for test selectors

**Depends on:** `/hal-dev-env` (interactive mode only); fed by `/hal-explore` or `/hal-spec` (OUIA Coverage sections listing missing IDs)

## Constants

```
HALOP_FEATURE_ROOT  = op/console/src/main/java/org/jboss/hal/op
IDS_JAVA_FILE       = resources/src/main/java/org/jboss/hal/resources/OuiaIds.java
DAVE_SELECTOR_FILE  = src/selectors/ids.ts
DAVE_OUIA_UTIL      = src/utils/ouia.ts
CONFIG_FILE         = .claude/hal-config.json
```

## Foundation Path Resolution

Uses the same resolution logic as all other skills:

1. Check if `.claude/hal-config.json` exists and has `foundationDir`
2. Check if `../foundation` exists relative to dave root
3. Prompt user via `AskUserQuestion`: "Enter the absolute path to the hal/foundation repository:"
4. Validate that `$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/` exists
5. Save valid path to `.claude/hal-config.json`

Implement the resolution steps above using Bash: read the JSON config with `node -e`, check directory existence, and validate the halOP source root. Exit with a clear error message if the path cannot be resolved.

## Dev Environment Check

Phase 1 interactive mode requires the dev environment. Check and warn (do not start it — that is `/hal-dev-env`'s job):

```bash
if ! curl -sf http://localhost:19090 >/dev/null 2>&1; then
  echo "WARNING: halOP is not running on port 19090."
  echo "Interactive browser exploration requires /hal-dev-env start."
  echo "You can still use spec-file audit or element-list modes."
fi
```

## OUIA ID Conventions

For detailed OUIA ID naming rules, common suffixes, Java application patterns, and `OuiaIds.java` section organization, consult **`references/conventions.md`**. Read it before adding any new IDs.

## Phase 1: Identify Missing IDs

### Input Mode A: Spec File Audit

When given a spec file path, trace its imports to find page objects and audit all selectors:

1. Read the spec file and identify imported page objects
2. Read each page object file
3. For each locator/selector in the page object and spec file, classify:
   - **Already OUIA** — uses `ouiaSelector()` → skip
   - **Can replace with OUIA** — uses `getByRole()`, `getByText()`, `locator(".css")` for an element that has a stable identity → candidate for OUIA ID
   - **Not suitable** — dynamic text, generic containers, or elements where semantic locators are correct → skip

4. For each candidate, trace the UI element back to halOP Java source:
   - Search `$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/` for the element creation
   - Identify the exact Java file and approximate line where `.ouiaId()` should be added
   - Check if the constant already exists in `OuiaIds.java` but isn't applied

5. Present the audit as a table:

```
## Selector Audit: <spec-file>

### Page Object: <page-object-file>

| Line | Current Selector | Element | Can Use OUIA? | Proposed ID | Java File |
|------|-----------------|---------|---------------|-------------|-----------|
| 23   | getByRole("button", { name: "Save" }) | Save button | YES | CONFIGURATION_SAVE_BTN | ConfigurationPage.java:45 |
| 45   | locator(".pf-v6-c-card") | Status card | YES | RUNTIME_STATUS_CARD | RuntimePage.java:72 |
| 67   | getByText("Server Running") | Status text | NO (dynamic) | — | — |
| 89   | ouiaSelector(NAV_DASHBOARD) | Nav link | ALREADY OUIA | — | — |

### Summary
- Already using OUIA: N selectors
- Can replace with OUIA: N selectors (N new IDs needed)
- Not suitable for OUIA: N selectors
```

### Input Mode B: Interactive Browser Exploration

Requires the dev environment to be running (`/hal-dev-env`).

1. Navigate to halOP with WildFly connected:

```
navigate_page → http://localhost:19090/?connect=http://localhost:19990
wait_for → ["Dashboard"]
```

2. Navigate to the feature area of interest
3. Take an accessibility snapshot
4. Identify elements **without** `data-ouia-component-id` attributes
5. Cross-reference against `src/selectors/ids.ts` — which IDs exist but aren't applied?
6. Cross-reference against `OuiaIds.java` — which constants exist but aren't used in the UI code?
7. Present candidates for new OUIA IDs

### Input Mode C: From hal-explore or hal-spec

Accept the "Missing OUIA IDs" or "OUIA Coverage" section from a `/hal-explore` gap report or `/hal-spec` proposal. Parse the listed elements and their feature areas, then proceed directly to Phase 2.

## Phase 2: Propose Changes

Present a proposal for user approval before writing any code. The proposal must include:

```
## Proposed OUIA ID Changes

### Feature: <feature-name>

### Constants to add to OuiaIds.java
| Constant | Value | Purpose |
|----------|-------|---------|
| RUNTIME_SERVER_STATUS | "hal-op-runtime-server-status" | Server status card |
| RUNTIME_REFRESH_BTN | "hal-op-runtime-refresh-btn" | Refresh button |

### Java files to modify
- `op/console/.../runtime/RuntimePage.java`
  - Line ~45: add `.ouiaId(OuiaIds.RUNTIME_SERVER_STATUS)` to status card builder
  - Line ~72: add `.ouiaId(OuiaIds.RUNTIME_REFRESH_BTN)` to refresh button

### Dave selectors that will become available after sync
| New Constant in ids.ts | Replaces Selector |
|------------------------|-------------------|
| RUNTIME_SERVER_STATUS | locator(".pf-v6-c-card") |
| RUNTIME_REFRESH_BTN | getByRole("button", { name: "Refresh" }) |
```

**Rules:**

- Wait for explicit user approval before proceeding to Phase 3
- If the user requests modifications, update the proposal and re-present
- Do NOT write any files without approval

## Phase 3: Implement & PR

After user approval:

### Step 1: Verify Clean State

```bash
cd "$FOUNDATION_DIR"
git status --porcelain
```

If there are uncommitted changes, warn the user and ask whether to proceed or abort.

### Step 2: Create Feature Branch

```bash
cd "$FOUNDATION_DIR"
git checkout main
git pull origin main
git checkout -b ouia/<feature>-ids
```

### Step 3: Add Constants to OuiaIds.java

Edit `$FOUNDATION_DIR/resources/src/main/java/org/jboss/hal/resources/OuiaIds.java`:

- Find the appropriate feature section (or create one)
- Insert new constants in alphabetical order within the section
- Follow existing naming patterns exactly

### Step 4: Add `.ouiaId()` Calls

For each Java file listed in the proposal:

- Find the element creation code
- Chain `.ouiaId(OuiaIds.CONSTANT)` at the appropriate position
- Ensure the import for `OuiaIds` exists

### Step 5: Verify Compilation

```bash
cd "$FOUNDATION_DIR"
./mvnw compile -P op -q
```

If compilation fails, analyze the error and fix. Do not proceed with a broken build.

### Step 6: Commit

```bash
cd "$FOUNDATION_DIR"
# Stage only the files modified in this skill run — never use git add -A
git add resources/src/main/java/org/jboss/hal/resources/OuiaIds.java
git add op/console/src/main/java/org/jboss/hal/op/<feature>/<modified-files>.java
git commit -m "feat: add OUIA IDs for <feature> testability

Added constants:
- <LIST_EACH_CONSTANT_NAME>

These IDs enable dave (halOP test suite) to target
<feature> elements with stable OUIA selectors."
```

### Step 7: Push and Create PR

```bash
cd "$FOUNDATION_DIR"
git push -u origin ouia/<feature>-ids
gh pr create \
  --title "feat: add OUIA IDs for <feature> testability" \
  --body "$(cat <<'EOF'
## Summary

Adds OUIA IDs to <feature> elements so they can be targeted by dave tests.

### New Constants in OuiaIds.java
<list each constant and its value>

### Modified Files
<list each Java file and what was changed>

### Testing
- [x] `./mvnw compile -P op` passes
- [ ] dave tests can use new IDs after sync (`pnpm sync:ouia`)
EOF
)"
```

### Step 8: Report PR URL

Report the PR URL to the user. The user handles review and merge.

### Step 9: Return to Dave

```bash
cd "<dave-root>"
```

Return to the dave working directory after PR creation.

## Phase 4: Wait & Sync

After the PR is merged (user triggers with `sync` argument or continues from Phase 3):

### Step 1: Check PR Status

```bash
cd "$FOUNDATION_DIR"
gh pr status
```

If the PR is not yet merged, report status and exit.

### Step 2: Monitor CI

```bash
cd "$FOUNDATION_DIR"
gh run list --workflow=hal-op.yml --limit=3
gh run list --workflow=test-suite.yml --limit=3
```

Report the status of recent workflow runs. If the latest run is still in progress, report and suggest re-running `/hal-ouia sync` later.

### Step 3: Check Container Image

```bash
cd "<dave-root>"
pnpm sync:status
```

Check if the remote container image has been updated with the new OUIA IDs.

### Step 4: Sync Dave

```bash
cd "<dave-root>"
pnpm sync:ouia
pnpm sync:image
```

Regenerate `src/selectors/ids.ts` from upstream and pull the latest container image.

### Step 5: Verify Constants

For each constant added in Phase 3, verify it appears in the regenerated file:

```bash
cd "<dave-root>"
grep -q "CONSTANT_NAME" src/selectors/ids.ts && echo "OK: CONSTANT_NAME" || echo "MISSING: CONSTANT_NAME"
# Repeat for each constant added in Phase 3
```

### Step 6: Report

Report which new constants are now available in `src/selectors/ids.ts` and ready for use in tests. If any are missing, suggest checking if the PR was merged and CI completed.

## Subcommand: `status`

Check CI pipeline and container image status without making changes:

```bash
echo "=== Foundation Repository ==="
cd "$FOUNDATION_DIR"
echo "Branch: $(git branch --show-current)"
echo ""

echo "=== Recent hal-op.yml Runs ==="
gh run list --workflow=hal-op.yml --limit=3
echo ""

echo "=== Recent test-suite.yml Runs ==="
gh run list --workflow=test-suite.yml --limit=3
echo ""

echo "=== Dave Sync Status ==="
cd "<dave-root>"
pnpm sync:status
```

## Error Handling

Handle these error cases:

1. **Foundation path not found** — Exit with clear message and instructions to set `foundationDir` in `.claude/hal-config.json`
2. **Dev environment not running (interactive mode)** — Warn and suggest running `/hal-dev-env start`, offer spec-file audit or element-list modes as alternatives
3. **Dirty git state in foundation** — Warn about uncommitted changes, ask user whether to proceed or abort
4. **Compilation failure after edits** — Analyze error, attempt fix, re-verify. If unfixable, revert changes and report
5. **PR creation failure** — Report `gh` CLI error, suggest checking authentication (`gh auth status`)
6. **CI pipeline failure** — Report which workflow failed, suggest checking the PR for issues
7. **Sync produces no new IDs** — Check if PR is merged, if CI completed, if container was rebuilt
8. **Chrome DevTools MCP not available (interactive mode)** — Fall back to spec-file audit mode, note that browser exploration requires Chrome DevTools MCP
9. **`gh` CLI not available** — Exit with message to install GitHub CLI (`brew install gh` or equivalent)

## Anti-Patterns

**Never:**

- Modify files without user approval (always propose first, then implement after approval)
- Merge PRs (user handles review and merge)
- Add IDs that aren't needed for testability (no speculative additions)
- Skip compilation verification after edits
- Modify dave's `ids.ts` directly (always use `pnpm sync:ouia` to regenerate)
- Start or stop the dev environment (that is `/hal-dev-env`'s responsibility)
- Write or modify dave test files or page objects (that is `/hal-spec`'s responsibility)
- Use non-standard OUIA ID naming (always follow `hal-op-<feature>-<element>` convention)
- Create constants without applying `.ouiaId()` calls (constants without usage are dead code)
- Cache or persist analysis results between invocations (always scan fresh)
