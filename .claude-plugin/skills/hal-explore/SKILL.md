---
name: hal-explore
description: This skill should be used when the user asks to "explore halop", "find untested features", "coverage gaps", "what should we test next", or invokes /hal-explore. Analyzes halOP test coverage gaps and explores the UI to propose new test scenarios.
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

## Input / Output

**Input:** Argument selecting analysis scope (code-only or code + browser)

**Output:** Prioritized gap report + test scenario proposals in `/hal-implement` format (see `references/proposal-format.md`)

**Feeds into:**

- `/hal-implement` — proposals are directly consumable as implementation input (skips hal-implement's own reconnaissance)
- `/hal-ouia` — the OUIA Coverage section identifies missing IDs that need to be added upstream

**Depends on:** `/hal-dev-env` (Phase 2 browser exploration only)

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
# Duplicated across skills — each skill is loaded independently by the plugin runtime
CONFIG_FILE=".claude/hal-config.json"
if [ -f "$CONFIG_FILE" ]; then
  FOUNDATION_DIR=$(node -e "const c=require('./$CONFIG_FILE');process.stdout.write(c.foundationDir||'')" 2>/dev/null)
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

  # Check for spec files (filename match or specPath reference)
  spec_match=$(find src/tests -name "*${feature}*" -o -name "*$(echo $feature | sed 's/./\U&/')*.spec.ts" 2>/dev/null | head -1)
  if [ -z "$spec_match" ]; then
    spec_match=$(grep -rl "specPath:.*${feature}" src/tests/ 2>/dev/null | head -1)
  fi
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

## Phase 2: Browser-Driven Exploration

Requires the dev environment to be running (`/hal-dev-env start`).

### Step 1: Navigate and Capture Snapshots

For each halOP feature identified in Phase 1 (especially those with gaps), navigate to the feature in the browser and capture an accessibility tree snapshot:

1. Navigate to halOP with WildFly connected:

```
navigate_page → http://localhost:19090/?connect=http://localhost:19990
```

2. Wait for the application to load:

```
wait_for → ["Dashboard"]
```

3. Take a snapshot to get the current page structure:

```
take_snapshot
```

4. Navigate to each feature area using sidebar navigation:
   - Dashboard → click the Dashboard nav link
   - Configuration → click Configuration, then explore sub-sections
   - Runtime → click Runtime
   - Deployments → click Deployments
   - Management model → click Management model
   - Tasks → click Tasks (quick-start link)

5. For each feature area, take a snapshot and identify:
   - Available OUIA component IDs (`data-ouia-component-id` attributes)
   - Interactive elements (buttons, links, inputs, selects)
   - Data tables and their columns
   - Form fields and their labels
   - Tree structures and their nodes

### Step 2: Interactive Flow Exploration

For features with FULL GAP or NEEDS TESTS status from Phase 1, perform deeper exploration:

1. **Configuration features**: Navigate into each configuration sub-section (Subsystems, Interfaces, Socket Bindings, Paths, System Properties). For each:
   - Take snapshot of the finder/column view
   - Click into a resource to see the detail view
   - Identify form fields and their OUIA IDs
   - Note which fields are editable vs. read-only

2. **Runtime features**: Navigate to Runtime section:
   - Take snapshot of server status view
   - Explore subsystem runtime views (if available)
   - Identify monitoring/metrics displays

3. **Deployment features**: Navigate to Deployments:
   - Take snapshot of deployment list
   - Identify upload/deploy actions
   - Note OUIA IDs on deployment cards/table

4. **Endpoint features**: Look for endpoint-related UI:
   - REST endpoints display
   - Endpoint details/forms

### Step 3: Selector Availability Check

For each explored feature, cross-reference discovered UI elements with available OUIA IDs in `src/selectors/ids.ts`:

```bash
echo "=== Selector Availability ==="
echo "| Feature | UI Element | OUIA ID in ids.ts | Status |"
echo "|---------|-----------|-------------------|--------|"
```

For each element found in snapshots:

- Check if an OUIA ID constant exists in `src/selectors/ids.ts`
- If yes, the element can be targeted with `ouiaSelector()`
- If no, note it as "NEEDS OUIA ID" — may require upstream hal/foundation change

## Test Scenario Proposals

For the proposal template, prioritization criteria, and output format, consult **`references/proposal-format.md`**. Each proposal covers page object structure, spec file layout, DMR setup/teardown, and test cases — ready to hand to `/hal-implement`.

## Error Handling

Handle these error cases:

1. **Foundation path not found** — Exit with clear message and instructions to set `foundationDir` in `.claude/hal-config.json`
2. **Dev environment not running (Phase 2)** — Exit with message to run `/hal-dev-env start` first
3. **No halOP features found** — Exit with message to verify foundation path points to correct repository
4. **Chrome DevTools MCP not available (Phase 2)** — Fall back to Phase 1 only, note that browser exploration requires Chrome DevTools MCP
5. **Browser navigation timeout** — Report which page failed to load and suggest checking dev environment status
6. **Empty snapshot** — Report the page URL and suggest the page may not have rendered; retry once after a 3-second wait

## Anti-Patterns

**Never:**

- Write or modify test files (this skill only proposes — hal-implement writes code)
- Write or modify page objects (same — hal-implement writes code)
- Start or stop containers (that is hal-dev-env's responsibility)
- Modify halOP source code or OUIA IDs (use `/hal-ouia` to add missing IDs upstream in hal/foundation)
- Cache or persist gap analysis results between invocations (always scan fresh)
- Skip Phase 1 when running `explore` argument (always run gap analysis first)
- Propose tests without specifying DMR setup/teardown when server state is needed
- Propose tests using CSS selectors when OUIA IDs are available
- Propose tests that depend on specific WildFly configuration not set up by DMR
