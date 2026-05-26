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
