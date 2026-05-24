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

## Foundation Path Resolution

The skill requires the path to the `hal/foundation` repository. Uses the same resolution logic as hal-dev-env:

1. Check if `.claude/hal-config.json` exists and has `foundationDir`
2. Check if `../foundation` exists relative to dave root
3. Prompt user via `AskUserQuestion`: "Enter the absolute path to the hal/foundation repository:"
4. Validate that `$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/` exists
5. Save valid path to `.claude/hal-config.json`

```bash
CONFIG_FILE=".claude/hal-config.json"
if [ -f "$CONFIG_FILE" ]; then
  FOUNDATION_DIR=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('foundationDir', ''))" 2>/dev/null)
fi

if [ -z "$FOUNDATION_DIR" ] || [ ! -d "$FOUNDATION_DIR" ]; then
  if [ -d "../foundation" ]; then
    FOUNDATION_DIR="../foundation"
  fi
fi

if [ -z "$FOUNDATION_DIR" ] || [ ! -d "$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/" ]; then
  echo "ERROR: Cannot locate hal/foundation repository."
  echo "Run /hal-dev-env first, or set foundationDir in .claude/hal-config.json"
  exit 1
fi
```

## Dev Environment Check (Phase 2 only)

Phase 2 (browser exploration) requires the dev environment to be running. Check before proceeding:

```bash
if ! curl -sf http://localhost:19090 >/dev/null 2>&1; then
  echo "ERROR: halOP is not running on port 19090."
  echo "Run /hal-dev-env start first."
  exit 1
fi

if ! curl -sf http://localhost:19990/management >/dev/null 2>&1; then
  echo "ERROR: WildFly is not running on port 19990."
  echo "Run /hal-dev-env start first."
  exit 1
fi
```

## Phase 1: Code-Level Gap Analysis

### Step 1: Inventory halOP Features

Scan `$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/` for feature directories and key Java files:

```bash
echo "=== halOP Feature Inventory ==="
FEATURE_ROOT="$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op"

for dir in "$FEATURE_ROOT"/*/; do
  feature=$(basename "$dir")
  java_count=$(find "$dir" -name "*.java" | wc -l | tr -d ' ')
  pages=$(find "$dir" -name "*Page.java" -o -name "*Column.java" | xargs -I{} basename {} .java 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
  echo "| $feature | $java_count files | ${pages:-none} |"
done
```

Present the inventory as a table:

```
| Feature       | Files | Key Classes (Pages/Columns)                    |
|---------------|-------|------------------------------------------------|
| bootstrap     | N     | ...                                            |
| configuration | N     | ConfigurationPage, SubsystemColumn, ...        |
| dashboard     | N     | DashboardPage, DashboardCard, ...              |
| deployment    | N     | DeploymentsPage                                |
| endpoint      | N     | Endpoint, EndpointForm, EndpointModal          |
| finder        | N     | ...                                            |
| modelbrowser  | N     | ModelBrowserPage                               |
| navigation    | N     | ...                                            |
| notification  | N     | ...                                            |
| resources     | N     | ...                                            |
| runtime       | N     | RuntimePage                                    |
| skeleton      | N     | ...                                            |
| task          | N     | TasksPage, DataSourceTask, LoggingTask, ...    |
```

### Step 2: Inventory Dave Tests and Page Objects

Scan `src/tests/` for spec files and `src/pages/` for page objects:

```bash
echo "=== Dave Test Inventory ==="
for spec in src/tests/**/*.spec.ts; do
  rel_path=${spec#src/tests/}
  test_count=$(grep -c "test(" "$spec" 2>/dev/null || echo 0)
  tags=$(grep -oP "tag:\s*\[([^\]]+)\]" "$spec" | head -1)
  echo "| $rel_path | $test_count tests | $tags |"
done

echo ""
echo "=== Dave Page Object Inventory ==="
for page in src/pages/*.page.ts; do
  page_name=$(basename "$page" .page.ts)
  methods=$(grep -cP "^\s+(async\s+)?\w+\(" "$page" 2>/dev/null || echo 0)
  echo "| $page_name | $methods methods |"
done

echo ""
echo "=== Registered Fixtures ==="
grep -P "^\s+\w+:" src/fixtures/pages.fixture.ts | grep -v "//" | head -20

echo ""
echo "=== Available Tags ==="
grep -P "^export const" src/tags.ts
```

### Step 3: Cross-Reference and Identify Gaps

Compare halOP features against dave coverage. For each halOP feature directory, check:

1. Does a corresponding spec file exist under `src/tests/`?
2. Does a corresponding page object exist under `src/pages/`?
3. Are OUIA IDs available in `src/selectors/ids.ts` for this feature?

```bash
echo "=== Coverage Gap Analysis ==="
echo "| halOP Feature  | Spec File | Page Object | OUIA IDs | Gap Level |"
echo "|----------------|-----------|-------------|----------|-----------|"

FEATURE_ROOT="$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op"
for dir in "$FEATURE_ROOT"/*/; do
  feature=$(basename "$dir")

  # Check for spec files
  spec_match=$(find src/tests -name "*${feature}*" -o -name "*$(echo $feature | sed 's/./\U&/')*.spec.ts" 2>/dev/null | head -1)
  spec_status="${spec_match:+YES}"
  spec_status="${spec_status:-NO}"

  # Check for page objects
  page_match=$(find src/pages -name "*${feature}*" 2>/dev/null | head -1)
  page_status="${page_match:+YES}"
  page_status="${page_status:-NO}"

  # Check for OUIA IDs
  feature_upper=$(echo "$feature" | tr '[:lower:]' '[:upper:]')
  ouia_count=$(grep -c "${feature_upper}" src/selectors/ids.ts 2>/dev/null || echo 0)
  ouia_status="$ouia_count IDs"

  # Determine gap level
  if [ "$spec_status" = "NO" ] && [ "$page_status" = "NO" ]; then
    gap="FULL GAP"
  elif [ "$spec_status" = "NO" ]; then
    gap="NEEDS TESTS"
  elif [ "$page_status" = "NO" ]; then
    gap="NEEDS PAGE"
  else
    gap="COVERED"
  fi

  echo "| $feature | $spec_status | $page_status | $ouia_status | $gap |"
done
```

### Step 4: Present Gap Report

After collecting all data, present a prioritized gap report:

```
## Coverage Gap Report

### Priority 1: Full Gaps (no tests, no page objects)
Features with complete test coverage gaps — these need both page objects and test specs.

### Priority 2: Needs Tests (page objects exist but no specs)
Features that have page objects but no test files exercising them.

### Priority 3: Needs Page Objects (tests reference features without dedicated pages)
Features tested inline without proper page object abstraction.

### Priority 4: Covered (both tests and page objects exist)
Features with existing coverage — may still have depth gaps.

### Recommended Next Steps
Based on the gap analysis:
1. Which features to tackle first (by user impact and complexity)
2. Which existing page objects could be extended
3. Which new page objects are needed
4. Which OUIA IDs are available vs. need to be added upstream
```
