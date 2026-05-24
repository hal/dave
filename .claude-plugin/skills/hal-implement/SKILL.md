---
name: hal-implement
description: Implement new halOP tests interactively with propose-approve-implement loop. Trigger with /hal-implement, "implement test", "write test for", "add test coverage for", or "test this feature".
metadata:
  version: "0.1.0"
---

# /hal-implement — Interactive Test Implementation

Writes new test cases and page objects in dave, guided by the halOP source and the running console. Works in an interactive propose-approve-implement loop: the skill reads halOP code, explores the live UI, proposes a test case for user approval, then writes page objects, fixtures, and spec files following dave conventions exactly.

## Tools

This skill uses the following pre-allowed tools:

- **Bash** — Execute shell commands for running tests, linting, formatting
- **Read** — Read source files (Java, TypeScript) for reconnaissance and convention reference
- **Write** — Create new page objects and spec files
- **Edit** — Update existing page objects, fixtures, tags, and spec files
- **Grep** — Search for patterns across halOP and dave codebases
- **Glob** — Find files matching patterns in both repositories

Browser exploration uses Chrome DevTools MCP tools:

- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page` — Navigate to halOP pages
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_snapshot` — Capture a11y tree snapshots
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__click` — Interact with UI elements
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot` — Capture visual state

## Arguments

- **No argument** — Start the propose-approve-implement loop. The skill asks what feature to test.
- **Feature name** (e.g., `deployment`, `runtime`, `configuration/subsystems`) — Start the loop for a specific feature area.
- **halOP source path** (e.g., `op/console/.../runtime/`) — Start from a specific halOP source directory.
- **hal-explore gap** (e.g., `deployment FULL GAP`) — Start from a specific gap identified by `/hal-explore`.

## Constants

```
HALOP_FEATURE_ROOT  = op/console/src/main/java/org/jboss/hal/op
DAVE_TEST_ROOT      = src/tests
DAVE_PAGE_ROOT      = src/pages
DAVE_FIXTURE_FILE   = src/fixtures/pages.fixture.ts
DAVE_WILDFLY_FIXTURE = src/fixtures/wildfly.fixture.ts
DAVE_SELECTOR_FILE  = src/selectors/ids.ts
DAVE_TAG_FILE       = src/tags.ts
DAVE_DMR_UTILS      = src/utils/dmr.ts
DAVE_OUIA_UTILS     = src/utils/ouia.ts
CONFIG_FILE         = .claude/hal-config.json
```
