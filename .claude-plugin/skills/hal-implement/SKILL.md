---
name: hal-implement
description: This skill should be used when the user asks to "implement test", "write test for", "add test coverage for", "test this feature", or invokes /hal-implement. Writes new halOP test cases and page objects interactively via a propose-approve-implement loop.
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

## Foundation Path Resolution

The skill requires the path to the `hal/foundation` repository. Uses the same resolution logic as hal-dev-env and hal-explore:

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

## Dev Environment Check

The skill requires the dev environment to be running for browser exploration and test execution:

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

## Dave Convention Reference

For detailed dave conventions (page objects, fixtures, specs, DMR, tags, selectors), consult **`references/conventions.md`**. Read it before writing any code — every file created or modified MUST follow those patterns exactly.

## Phase 1: Reconnaissance

Before proposing any test, gather information about the target feature.

### Step 1: Identify the Target

Determine what feature to test based on the user's input:

- **Feature name** → map to halOP source directory (e.g., "deployment" → `$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/deployment/`)
- **hal-explore gap** → use the gap report to identify the feature directory
- **halOP source path** → use directly
- **No input** → ask the user what feature to test via `AskUserQuestion`

### Step 2: Read halOP Source

Scan the feature directory in halOP to understand the UI structure:

```bash
FEATURE_DIR="$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/<feature>"

echo "=== Feature Source Files ==="
find "$FEATURE_DIR" -name "*.java" -type f | sort

echo ""
echo "=== Key Classes ==="
grep -l "Page\|Column\|Form\|Table\|Modal" "$FEATURE_DIR"/*.java 2>/dev/null

echo ""
echo "=== OUIA IDs Used ==="
grep -rh "Ids\." "$FEATURE_DIR"/ | grep -oP 'Ids\.\w+' | sort -u
```

Read the key Java files to understand:

- What pages and views exist
- What forms, tables, and interactive elements are present
- What OUIA IDs are applied to elements
- What management model resources are displayed

### Step 3: Check Existing Dave Coverage

Check what tests and page objects already exist for this feature:

```bash
echo "=== Existing Spec Files ==="
find src/tests -name "*<feature>*" -type f 2>/dev/null

echo ""
echo "=== Existing Page Objects ==="
find src/pages -name "*<feature>*" -type f 2>/dev/null

echo ""
echo "=== OUIA IDs Available ==="
grep -i "<feature>" src/selectors/ids.ts 2>/dev/null
```

### Step 4: Browser Reconnaissance

Navigate to the feature in the running halOP console to observe the actual UI:

1. Navigate to halOP:

```
navigate_page → http://localhost:19090/?connect=http://localhost:19990
```

2. Wait for the application to load:

```
wait_for → ["Dashboard"]
```

3. Navigate to the target feature area using sidebar navigation or direct URL

4. Take a snapshot to capture the accessibility tree:

```
take_snapshot
```

5. Identify from the snapshot:
   - Available `data-ouia-component-id` attributes
   - Interactive elements (buttons, links, inputs, selects, trees)
   - Data tables and their columns
   - Form fields and their labels
   - Navigation structure within the feature

6. Cross-reference discovered elements with OUIA IDs in `src/selectors/ids.ts`:
   - Elements with OUIA IDs → use `ouiaSelector()`
   - Elements without OUIA IDs → use role/text selectors, note for potential `hal-ouia` work

## Phase 2: Propose Test Case

After reconnaissance, propose a concrete test case to the user for approval.

### Proposal Format

Present each proposal in this format:

````markdown
## Proposed Test: <feature> / <scenario>

**Category:** <test directory name, e.g., "configuration", "runtime", "deployment">
**Tags:** [Tag.<TAG>.value, ...]
**Spec path:** <category>/<name>

### Page Object

**Status:** NEW — `src/pages/<name>.page.ts` | EXTEND — `src/pages/<existing>.page.ts`

Locators:

- `heading` → `page.locator('#hal-main').getByRole('heading', { name: '<Name>', level: 1 })`
- `<element>` → `ouiaSelector(ids.<CONSTANT>)` or `page.getByRole(...)`

Methods:

- `navigate()` → clicks nav link, waits for heading
- `<action>()` → describes what the method does

### Fixture Registration

Changes needed in `src/fixtures/pages.fixture.ts`:

- Import: `import { ExamplePage } from "../pages/example.page.js";`
- Interface: `examplePage: ExamplePage;`
- Fixture: `examplePage: async ({ page, wildfly }, use) => { ... }`

### Test Cases

1. **<test name>** — <what it verifies>
   - Navigate to <page>
   - Assert <element> is visible
   - Perform <action>
   - Verify <result>

2. **<test name>** — <what it verifies>
   - ...

### DMR Setup/Teardown

```typescript
// Setup
await addResource(wildfly.managementUrl, ["resource-type", "name"], { attr: "value" });

// Teardown
await removeResource(wildfly.managementUrl, ["resource-type", "name"]);
```

### OUIA Coverage

- Available: <list of OUIA IDs that exist for this feature>
- Missing: <list of elements that need OUIA IDs — requires /hal-ouia>
````

### Proposal Rules

1. **One test scenario per proposal** — don't bundle multiple unrelated scenarios
2. **Concrete selectors** — every locator must reference either an OUIA constant from `src/selectors/ids.ts` or a specific role/text selector observed in the browser snapshot
3. **Concrete DMR addresses** — every setup/teardown must use actual management model paths
4. **Realistic assertions** — only assert things that were observed in the browser snapshot
5. **Follow conventions** — all code snippets must match the Dave Convention Reference exactly

### User Approval

After presenting the proposal, ask the user:

> "Does this test proposal look good? You can:
>
> - **Approve** — I'll implement it
> - **Adjust** — tell me what to change
> - **Skip** — move to the next scenario
> - **Stop** — end the session"

Wait for the user's response. Do NOT proceed to implementation without explicit approval.

## Phase 3: Implement

After the user approves a proposal, implement the test case. Follow these steps in order.

### Step 1: Create or Update Page Object

If the proposal specifies a NEW page object:

1. Create `src/pages/<name>.page.ts`
2. Follow the Page Object Pattern from the Dave Convention Reference exactly
3. Import `BasePage` and extend it
4. Declare all locators as `readonly` properties
5. Add `navigate()` method if the page needs explicit navigation
6. Add action methods as proposed

If the proposal specifies EXTEND:

1. Read the existing page object first
2. Add new locators and methods without modifying existing ones
3. Maintain the same code style as the existing file

### Step 2: Register Fixture (new page objects only)

If a new page object was created, update `src/fixtures/pages.fixture.ts`:

1. Read the entire file first to understand the current structure
2. Add the import at the top with existing imports (alphabetical order)
3. Add the property to the `PageFixtures` interface (alphabetical order)
4. Add the fixture definition in the `test.extend<PageFixtures>()` call

### Step 3: Add Tag (if needed)

If the proposal uses a new tag not yet in `src/tags.ts`:

1. Read `src/tags.ts` first
2. Add the new tag constant in alphabetical order within the `Tag` object
3. Follow the Tag Pattern from the Dave Convention Reference

### Step 4: Create Spec File

Create the spec file at `src/tests/<category>/<name>.spec.ts`:

1. Follow the Spec File Pattern from the Dave Convention Reference exactly
2. Import `test` and `expect` from the correct fixture file
3. Import `Tag` from `../../tags.js`
4. Import DMR utilities if setup/teardown is needed
5. Set `specPath` via `test.use()`
6. Wrap tests in `test.describe()` with tags
7. Use `test.describe.serial()` for ordered test sequences (CRUD)
8. Implement each test case as proposed

### Step 5: Format and Lint

After writing all files, run formatting and linting:

```bash
pnpm format
pnpm lint:fix
```

Fix any issues reported by ESLint or Prettier before proceeding.

## Phase 4: Verify

Run the newly created test to verify it passes.

### Step 1: Run the Test

```bash
pnpm test -- src/tests/<category>/<name>.spec.ts --project=chromium
```

### Step 2: Evaluate Results

**If the test passes:**

- Report success to the user
- Show the test output summary
- Proceed to Phase 5

**If the test fails:**

- Read the error output carefully
- Identify whether the failure is in:
  - **Selector** — element not found → take a new browser snapshot, check the actual DOM
  - **Assertion** — value mismatch → check expected vs. actual, adjust assertion or test logic
  - **DMR** — setup/teardown failure → verify the management model address is correct
  - **Timeout** — page didn't load → check navigation steps, add explicit waits
- Fix the issue in the relevant file (page object, spec, or fixture)
- Re-run the test
- Maximum 3 fix-and-retry attempts. If still failing after 3 attempts, report the failure to the user with the error details and ask how to proceed.

### Step 3: Commit Passing Test

After the test passes, ask the user before committing:

> "Tests pass. Shall I commit these changes?"

If the user approves:

```bash
pnpm format
pnpm lint:fix
git add src/pages/<name>.page.ts src/tests/<category>/<name>.spec.ts src/fixtures/pages.fixture.ts src/tags.ts
git commit -m "test: add <feature> <scenario> test"
```

Only stage files that were actually created or modified.

## Phase 5: Iterate

After a test is committed, propose the next test case.

### Iteration Loop

1. **Same feature** — if there are more scenarios to test for the current feature:
   - Skip Phase 1 (reconnaissance already done)
   - Go to Phase 2 (propose next test case)

2. **New feature** — if the user wants to move to a different feature:
   - Go to Phase 1 (new reconnaissance)

3. **Stop** — if the user says stop, end the session with a summary.

### Session Summary

When the session ends, present:

```markdown
## Implementation Summary

**Tests created:** <count>
**Files created/modified:**

- `src/pages/<name>.page.ts` — NEW
- `src/tests/<category>/<name>.spec.ts` — NEW
- `src/fixtures/pages.fixture.ts` — MODIFIED
- `src/tags.ts` — MODIFIED (if new tags added)

**Test results:** All passing ✓

**OUIA gaps identified:** (if any)

- <element> in <feature> needs OUIA ID → run /hal-ouia
```

## Error Handling

Handle these error cases:

1. **Foundation path not found** — Exit with clear message and instructions to set `foundationDir` in `.claude/hal-config.json`
2. **Dev environment not running** — Exit with message to run `/hal-dev-env start` first
3. **No halOP features found for target** — Report the searched path and suggest checking the feature name
4. **Chrome DevTools MCP not available** — Fall back to code-only reconnaissance (skip browser snapshot steps), warn that selectors may be less accurate
5. **Browser navigation timeout** — Report which page failed to load and suggest checking dev environment status
6. **Empty snapshot** — Report the page URL and suggest the page may not have rendered; retry once after a 3-second wait
7. **Test failure after 3 retries** — Report the full error to the user, show the failing test code, and ask how to proceed (fix, skip, or stop)
8. **Lint/format failure** — Show the error, fix automatically if possible, otherwise report to user

## Anti-Patterns

**Never:**

- Write code without user approval of the proposal (Phase 2 → approval → Phase 3)
- Create page objects that don't extend `BasePage`
- Use CSS class selectors when OUIA IDs or role selectors are available
- Import from `@playwright/test` in spec files (import from fixture files instead)
- Skip fixture registration when creating a new page object
- Hardcode WildFly URLs in page objects or tests (use `wildfly.managementUrl`)
- Create tests that depend on specific WildFly configuration not set up by DMR
- Skip formatting and linting before committing
- Leave test resources uncleaned after tests (always add DMR teardown)
- Propose tests for features that aren't visible in the running console
- Modify halOP source code or OUIA IDs (those changes happen via `/hal-ouia`)
- Bundle multiple unrelated test scenarios in one proposal
