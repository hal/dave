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

## Foundation Path Resolution

The skill requires the path to the `hal/foundation` repository. Uses the same resolution logic as hal-dev-env and hal-explore:

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

Before writing any code, read these conventions. Every file you create or modify MUST follow these patterns exactly. When in doubt, read the existing source files listed below — they are the canonical reference.

### Page Object Pattern

Page objects live in `src/pages/` and extend `BasePage` from `src/pages/base.page.ts`:

```typescript
import type { Locator, Page } from "@playwright/test";
import { SOME_ID } from "../selectors/ids.js";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

export class ExamplePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(`#${MAIN_ID}`).getByRole("heading", { name: "Example", level: 1 });
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_EXAMPLE)).click();
    await this.heading.waitFor({ state: "visible" });
  }
}
```

**Rules:**

- Extend `BasePage` — never create standalone page classes
- Declare locators as `readonly` properties in the constructor
- Use OUIA selectors (`ouiaSelector(CONSTANT)`) for elements that have `data-ouia-component-id`
- Fall back to `page.getByRole()`, `page.getByText()`, or `page.locator()` only when no OUIA ID exists
- Import OUIA constants from `../selectors/ids.js`
- Include a `navigate()` method if the page needs explicit navigation
- Page objects are pure UI concerns — no WildFly URLs or infrastructure
- Reference: `src/pages/configuration.page.ts`, `src/pages/model-browser.page.ts`

### Fixture Registration Pattern

New page objects must be registered in `src/fixtures/pages.fixture.ts`. Three changes are needed:

1. **Import** the page class
2. **Add to the `PageFixtures` interface**
3. **Add the fixture definition** in the `test.extend<PageFixtures>()` call

```typescript
// 1. Import (add with existing imports)
import { ExamplePage } from "../pages/example.page.js";

// 2. Interface (add property)
interface PageFixtures {
  // ... existing entries ...
  examplePage: ExamplePage;
}

// 3. Fixture definition (add in test.extend block)
examplePage: async ({ page, wildfly }, use) => {
  await openHalOp(page, wildfly.managementUrl);
  const examplePage = new ExamplePage(page);
  await examplePage.navigate();  // only if the page has navigate()
  await use(examplePage);
},
```

**Rules:**

- Every fixture calls `openHalOp(page, wildfly.managementUrl)` first
- Call `navigate()` if the page object has one
- Use `await use(pageObject)` to hand the page to the test
- Reference: `src/fixtures/pages.fixture.ts` (read the entire file before modifying)

### Spec File Pattern

Spec files live in `src/tests/<category>/` and follow this exact structure:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "<category>/<name>" });

test.describe("<Feature Name>", { tag: [Tag.FEATURE.value] }, () => {
  test("<test description>", async ({ examplePage }) => {
    await expect(examplePage.heading).toBeVisible();
  });
});
```

**Rules:**

- Import `test` and `expect` from `../../fixtures/pages.fixture.js` (for tests that need WildFly)
- Import from `../../fixtures/wildfly.fixture.js` only for tests that don't need page objects
- Set `specPath` via `test.use()` — this determines the WildFly container name
- Wrap tests in `test.describe()` with appropriate tags
- Use `test.describe.serial()` for tests that must run in order (e.g., CRUD sequences)
- Destructure page objects and `wildfly` from the test function parameter
- Access `wildfly.managementUrl` for DMR operations
- Reference: `src/tests/model-browser/crud.spec.ts`, `src/tests/configuration/configuration.spec.ts`

### DMR Setup and Teardown

Tests that need specific WildFly state use DMR utilities from `src/utils/dmr.ts`:

```typescript
import { addResource, removeResource, readAttribute, resourceExists } from "../../utils/dmr.js";

// Setup: create a resource before the test
await addResource(wildfly.managementUrl, ["system-property", "test-prop"], { value: "test-value" });

// Verification: check WildFly state after UI action
const value = await readAttribute(wildfly.managementUrl, ["system-property", "test-prop"], "value");
expect(value).toBe("test-value");

// Teardown: clean up after the test
await removeResource(wildfly.managementUrl, ["system-property", "test-prop"]);

// Check existence
const exists = await resourceExists(wildfly.managementUrl, ["system-property", "test-prop"]);
```

**Rules:**

- `DmrAddress` is `readonly string[]` — alternating resource-type/resource-name pairs
- Always clean up resources created during tests
- Use `test.afterAll()` or `test.afterEach()` for cleanup, or place cleanup in the last serial test
- Verify WildFly state with DMR after UI operations to confirm the UI action had the expected effect
- Reference: `src/utils/dmr.ts`, `src/tests/model-browser/crud.spec.ts`

### Tag Pattern

Tags are defined in `src/tags.ts` as constants:

```typescript
export const Tag = {
  // ... existing tags ...
  NEW_FEATURE: { value: "@new-feature", description: "New feature tests" },
} as const satisfies Record<string, TagDefinition>;
```

**Rules:**

- Tag key: `UPPER_SNAKE_CASE`
- Tag value: `@kebab-case`
- Always include a description
- Reuse existing tags when they fit (check `src/tags.ts` before adding new ones)
- Reference: `src/tags.ts`

### Selector Strategy

Selector priority order:

1. **OUIA selectors** — `ouiaSelector(CONSTANT)` from `src/utils/ouia.ts` for elements with `data-ouia-component-id`
2. **Role selectors** — `page.getByRole("button", { name: "Save" })` for standard accessible elements
3. **Text selectors** — `page.getByText("some text")` for visible text
4. **CSS selectors** — `page.locator(".css-class")` only as a last resort

Check `src/selectors/ids.ts` for available OUIA ID constants before writing selectors.

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
