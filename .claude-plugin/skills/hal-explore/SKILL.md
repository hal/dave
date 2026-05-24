---
name: hal-explore
description: Analyze halOP test coverage gaps and explore the UI to propose new test scenarios. Trigger with /hal-explore, "explore halop", "find untested features", "coverage gaps", or "what should we test next".
metadata:
  version: "0.1.0"
---

# /hal-explore — Coverage Gap Analysis & UI Exploration

Identifies untested halOP features by cross-referencing the halOP source tree with existing dave tests and page objects, then optionally explores the live UI via Chrome DevTools MCP to propose concrete test scenarios.

## Tools

This skill uses the following pre-allowed tools:

- **Bash** — Execute shell commands for directory listing, file analysis, grep operations
- **Read** — Read source files (Java, TypeScript) for feature and test inventory
- **Grep** — Search for patterns across halOP and dave codebases
- **Glob** — Find files matching patterns in both repositories

Browser exploration (Phase 2) uses Chrome DevTools MCP tools:

- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page` — Navigate to halOP pages
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_snapshot` — Capture a11y tree snapshots
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__click` — Interact with UI elements
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot` — Capture visual state

## Arguments

- **No argument or `gaps`** — Run Phase 1 only: code-level gap analysis (default)
- **`explore`** — Run Phase 1 + Phase 2: gap analysis followed by browser exploration
- **`explore-only`** — Run Phase 2 only: browser exploration (requires dev environment running)

## Constants

```
HALOP_FEATURE_ROOT  = op/console/src/main/java/org/jboss/hal/op
DAVE_TEST_ROOT      = src/tests
DAVE_PAGE_ROOT      = src/pages
DAVE_SELECTOR_FILE  = src/selectors/ids.ts
DAVE_TAG_FILE       = src/tags.ts
DAVE_DMR_UTILS      = src/utils/dmr.ts
DAVE_FIXTURE_FILE   = src/fixtures/pages.fixture.ts
CONFIG_FILE         = .claude/hal-config.json
```
