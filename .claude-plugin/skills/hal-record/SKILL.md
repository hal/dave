---
name: hal-record
description: This skill should be used when the user asks to "record test", "record interaction", "capture test", "codegen", or invokes /hal-record. Records browser interactions via Playwright codegen and scaffolds test proposals for /hal-implement.
metadata:
  version: "0.1.0"
---

# /hal-record — Record & Scaffold Tests

Records user interactions in a live halOP browser session via Playwright codegen and produces a test proposal that feeds into `/hal-implement`. Bridges the gap between manual exploration and test scaffolding by capturing real user actions and transforming them into dave-convention proposals.

## Tools

This skill uses the following pre-allowed tools:

- **Bash** — Launch codegen, check dev env health, read recording file
- **Read** — Read `src/selectors/ids.ts` for OUIA constant mapping, read existing page objects
- **Grep** — Search for OUIA constants, check for existing coverage
- **AskUserQuestion** — Proposal approval, feature name input

## Arguments

- **(none)** — Launches codegen immediately. After the recording is parsed, the skill infers the feature area from navigation paths in the recording (e.g., clicking the "Configuration" nav item → feature is `configuration`). If the feature area cannot be inferred, asks via `AskUserQuestion`.
- **Feature name** (e.g., `deployment`) — Pre-tags the proposal with the feature area, skipping inference.

## Constants

```text
HALOP_PORT          = 19090
WILDFLY_MGMT_PORT   = 19990
HALOP_URL           = http://localhost:19090
WILDFLY_MGMT_URL    = http://localhost:19990
CODEGEN_URL         = http://localhost:19090/?connect=http://localhost:19090
DAVE_SELECTOR_FILE  = src/selectors/ids.ts
RECORDING_DIR       = /tmp
RECORDING_PREFIX    = dave-recording
```

## Phase 1: Prerequisites Check

Verify the dev environment is running before launching codegen. Do NOT start containers — that is `/hal-dev-env`'s job.

### Step 1: Check halOP

```bash
if ! curl -sf http://localhost:19090 >/dev/null 2>&1; then
  echo "ERROR: halOP is not running on port 19090."
  echo "Run /hal-dev-env start first."
  exit 1
fi
```

### Step 2: Check WildFly

```bash
if ! curl -sf http://localhost:19990/management >/dev/null 2>&1; then
  echo "ERROR: WildFly is not running on port 19990."
  echo "Run /hal-dev-env start first."
  exit 1
fi
```

### Step 3: Check Playwright

```bash
if ! npx playwright --version >/dev/null 2>&1; then
  echo "ERROR: Playwright not available. Run 'pnpm install' first."
  exit 1
fi
```

## Phase 2: Launch Codegen

### Step 1: Generate Recording Filename

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RECORDING_FILE="/tmp/dave-recording-${TIMESTAMP}.ts"
```

### Step 2: Print Instructions

Before launching codegen, print:

```text
Starting Playwright recorder...

Record your test scenario in the browser that opens.
Tips:
  - Click elements to record actions
  - Use the "Assert" toolbar button to add visibility/text checks
  - Close the browser when you're done recording

Waiting for recording to complete...
```

### Step 3: Launch Codegen

```bash
npx playwright codegen \
  --target playwright-test \
  --test-id-attribute data-ouia-component-id \
  -o "$RECORDING_FILE" \
  "http://localhost:19090/?connect=http://localhost:19990"
```

This command blocks until the user closes the codegen browser. When it exits:

- The recording is saved to `$RECORDING_FILE`
- Control returns to the skill

### Step 4: Validate Recording

```bash
if [ ! -f "$RECORDING_FILE" ]; then
  echo "ERROR: Recording was not saved to $RECORDING_FILE. Try again?"
  exit 1
fi

LINE_COUNT=$(wc -l < "$RECORDING_FILE")
if [ "$LINE_COUNT" -lt 5 ]; then
  echo "WARNING: Recording appears empty or boilerplate-only ($LINE_COUNT lines)."
  echo "No actions recorded. Try again?"
  exit 1
fi

echo "Recording saved to $RECORDING_FILE ($LINE_COUNT lines)"
```

### Codegen Configuration Rationale

- `--target playwright-test` — generates `test()` / `expect()` syntax matching dave's test format
- `--test-id-attribute data-ouia-component-id` — makes codegen prefer OUIA selectors, producing `getByTestId('ouia-id')` calls
- `-o` with timestamp — avoids overwriting previous recordings
- URL includes `?connect=...` — halOP needs the WildFly management URL as a query parameter

## Phase 3: Parse Recording

After codegen exits, read and analyze the recording file.

### Step 1: Read the Recording

Read the recording file with the **Read** tool. A typical recording looks like:

```typescript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:19090/?connect=http://localhost:19990');
  await page.getByTestId('nav-configuration').click();
  await page.getByTestId('cfg-subsystems-item').click();
  await page.getByRole('heading', { name: 'Logging' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Level' }).fill('DEBUG');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Step 2: Extract Actions

For each non-blank, non-import, non-boilerplate line inside the `test()` body, classify it:

| Pattern | Classification |
| ------- | -------------- |
| `page.goto(...)` | navigation |
| `.click()` | click action |
| `.fill(...)` | fill action |
| `.check()` / `.uncheck()` | toggle action |
| `.selectOption(...)` | select action |
| `expect(...).toBeVisible()` | visibility assertion |
| `expect(...).toHaveText(...)` | text assertion |
| `expect(...).toContainText(...)` | text assertion |

### Step 3: Map getByTestId Selectors to OUIA Constants

Read `src/selectors/ids.ts` and build a lookup from OUIA ID values to constant names.

The file contains lines like:

```typescript
export const NAV_CONFIGURATION = "hal-op-nav-configuration";
export const CFG_SUBSYSTEMS_ITEM = "hal-op-cfg-subsystems-item";
```

For each `getByTestId('some-id')` in the recording:

1. Search `ids.ts` for a constant whose **value** matches `"hal-op-some-id"` (note: codegen may strip the `hal-op-` prefix depending on the OUIA attribute value)
2. Also try matching the raw value `"some-id"` directly
3. If a match is found, record the mapping: `getByTestId('some-id')` → `ids.CONSTANT_NAME`
4. If no match is found, flag it as **unmatched** — the OUIA ID exists in the DOM but not in `ids.ts`

Use **Grep** to verify matches:

```bash
grep -n "some-id" src/selectors/ids.ts
```

### Step 4: Identify Non-OUIA Selectors

Any line using `getByRole(...)`, `getByText(...)`, `getByLabel(...)`, or `locator(...)` instead of `getByTestId(...)` is a non-OUIA selector. Collect these for the proposal's OUIA Coverage section.

### Step 5: Infer Feature Area

If no feature name was provided as an argument, infer it from the recording:

1. Look for navigation clicks on OUIA nav items (e.g., `getByTestId('nav-configuration')` → feature is `configuration`)
2. Look for `page.goto()` URLs containing feature paths
3. If neither works, ask the user via `AskUserQuestion`:
   > "What feature area does this recording cover? (e.g., configuration, runtime, deployment)"

### Step 6: Group Actions into Logical Steps

Organize the extracted actions into test steps:

1. **Setup** — initial navigation (`goto`, nav clicks) before the main action
2. **Action** — the core interaction (fill, click, select)
3. **Verification** — assertions (`expect` calls)

If the recording contains multiple distinct action-verification cycles, propose multiple test cases within the same spec.
