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
