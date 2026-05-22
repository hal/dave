# Writing Tests

This guide walks you through writing tests for dave — from your first test to adding new page objects. It's written for contributors who may be new to Playwright. For Playwright-specific terminology, see the [Glossary](glossary.md). For a deep dive into how fixtures work, see [Fixtures and Dependency Injection](fixtures.md).

## Before You Start

Make sure you can run the existing tests:

```bash
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm test
```

If that works, you're ready to write tests.

## The Big Picture

Every test in dave follows the same pattern:

1. A **WildFly container** is started automatically (one per test file)
2. The **halOP management console** (already running) connects to that WildFly instance
3. Your test receives a **page object** with halOP already loaded and navigated
4. You write **assertions** against the UI

You don't start containers, open browsers, or navigate to URLs. The fixture system handles all of that. Your job is to describe what the UI should look like and how it should behave.

## Your First Test

Here's the simplest possible test:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";

test.use({ specPath: "smoke/my-feature" });

test.describe("My Feature", () => {
  test("shows the dashboard heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });
});
```

Let's break down every line.

### The Import

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
```

This imports dave's customized versions of `test` and `expect`. They come with WildFly containers and page objects built in. You always import from one of two places:

| Import from                         | When to use                                    |
| ----------------------------------- | ---------------------------------------------- |
| `../../fixtures/pages.fixture.js`   | Most tests — you need page objects and WildFly |
| `../../fixtures/wildfly.fixture.js` | Simple tests that don't need page objects      |

Never import `test` or `expect` directly from `@playwright/test` in spec files — you'd lose the container lifecycle and page object injection.

### The Spec Path

```typescript
test.use({ specPath: "smoke/my-feature" });
```

This tells the fixture system what to name your WildFly container. The name becomes `dave_smoke_my-feature_chromium` (or `_firefox`, `_webkit`). Each unique `specPath` gets its own container, so different test files don't interfere with each other.

**Convention:** use the test file's path relative to `src/tests/`, without the `.spec.ts` extension. For `src/tests/smoke/dashboard.spec.ts`, use `"smoke/dashboard"`.

### The Test Block

```typescript
test.describe("My Feature", () => {
  test("shows the dashboard heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });
});
```

- **`test.describe`** groups related tests. All tests in a describe block share the same WildFly container.
- **`test`** defines a single test. The `async` function receives fixtures as a destructured object.
- **`{ dashboardPage }`** — by listing `dashboardPage` in the parameters, you're asking the fixture system to create it. Before your test runs, the fixture will: start WildFly (if not already running), open halOP, connect to WildFly, and create the page object.
- **`expect(...).toBeVisible()`** — Playwright's assertion. It automatically waits and retries until the element is visible or the timeout expires.

### What You Can Request

List any combination of these in your test function parameters:

```typescript
test("example", async ({ page, wildfly, dashboardPage, navigationPage }) => {
  // Use whichever you need
});
```

| Parameter           | What you get                                                  |
| ------------------- | ------------------------------------------------------------- |
| `page`              | Playwright's `Page` — the browser tab (OUIA already enabled)  |
| `wildfly`           | The WildFly container — `httpUrl` and `managementUrl`         |
| `basePage`          | Minimal page object, halOP loaded at root                     |
| `dashboardPage`     | Dashboard page object, halOP loaded at root                   |
| `navigationPage`    | Navigation page object, halOP loaded at root                  |
| `configurationPage` | Configuration page object, navigated to Configuration section |
| `modelBrowserPage`  | Model Browser page object, navigated to Model Browser section |
| `tasksPage`         | Tasks page object, navigated to Tasks section                 |

Fixtures are **lazy** — only the ones you list in the parameters are created. If you only need `navigationPage`, the dashboard and model browser fixtures never run.

## Writing Assertions

Playwright provides two main assertion styles:

### Element Assertions (most common)

```typescript
// Visibility
await expect(dashboardPage.heading).toBeVisible();
await expect(dashboardPage.heading).toBeHidden();

// Text content
await expect(dashboardPage.heading).toHaveText("Dashboard");
await expect(dashboardPage.heading).toContainText("Dash");

// Attributes
await expect(modelBrowserPage.tab("Data")).toHaveAttribute("aria-selected", "true");

// State
await expect(modelBrowserPage.backButton).toBeDisabled();
await expect(modelBrowserPage.findButton).toBeEnabled();
```

### Value Assertions

```typescript
// Plain values (non-retrying)
const text = await modelBrowserPage.breadcrumbText();
expect(text).toContain("subsystem");

// Page title
await expect(page).toHaveTitle(/hal/i);
```

**Key difference:** assertions on locators (like `await expect(locator).toBeVisible()`) automatically **wait and retry** until the condition is met or the timeout expires. Assertions on plain values (`expect(text).toContain(...)`) do **not** retry — they pass or fail immediately.

## Finding Elements

### Using Page Objects (preferred)

Page objects expose locators as properties and methods:

```typescript
// Properties — defined in the constructor
await expect(dashboardPage.heading).toBeVisible();
await expect(modelBrowserPage.tree).toBeVisible();

// Methods — for dynamic elements
await expect(modelBrowserPage.treeItem("subsystem")).toBeVisible();
await expect(navigationPage.link("Dashboard")).toBeVisible();
```

### Using OUIA IDs

halOP uses [OUIA](https://ouia.readthedocs.io/) attributes (`data-ouia-component-id`) for stable element identification. The IDs are defined in `src/selectors/ids.ts` (generated from halOP's Java source).

```typescript
import { MAIN_ID, NAV_DASHBOARD } from "../selectors/ids.js";
import { ouiaSelector } from "../utils/ouia.js";

// ouiaSelector("nav-dashboard") → '[data-ouia-component-id="nav-dashboard"]'
const navLink = page.locator(ouiaSelector(NAV_DASHBOARD));
```

### Using Playwright's Built-in Locators

When OUIA IDs aren't available, use Playwright's semantic locators (in order of preference):

```typescript
// By role (best — matches how users perceive the page)
page.getByRole("button", { name: "Submit" });
page.getByRole("heading", { name: "Dashboard", level: 1 });
page.getByRole("tab", { name: "Attributes" });
page.getByRole("treeitem", { name: "subsystem", exact: true });

// By text
page.getByText("WildFly", { exact: true });
page.getByText(/running/i); // regex for case-insensitive

// By label (form elements)
page.getByLabel("Filter by name");

// By test ID (if available)
page.getByTestId("my-element");

// By CSS selector (last resort)
page.locator("#hal-root-container");
page.locator('[data-ouia-component-type="PF6/Component/Card"]');
```

### Scoping Locators

Narrow your search to a specific section to avoid matching elements elsewhere on the page:

```typescript
// Scope to the main content area
const main = page.locator(`#${MAIN_ID}`);
const heading = main.getByRole("heading", { name: "Overview", level: 2 });

// Scope to a specific tab panel
const panel = modelBrowserPage.tabPanel("Operations");
await expect(panel.getByText("add", { exact: true })).toBeVisible();

// Chain .filter() for card-like elements
const card = page
  .locator('[data-ouia-component-type="PF6/Component/Card"]')
  .filter({ has: page.getByRole("heading", { name: "Data source", level: 2 }) });
```

## Performing Actions

### Clicking

```typescript
await navigationPage.link("Dashboard").click();
await modelBrowserPage.findButton.click();
```

### Waiting After Actions

Some actions cause navigation or content changes. Wait for the result:

```typescript
// Wait for an element to appear
await navigationPage.navigateTo("Dashboard");
// navigateTo() already waits internally — see the page object source

// Explicit wait when needed
await modelBrowserPage.findButton.click();
await expect(modelBrowserPage.findResourceModal).toBeVisible();
```

### Running CLI Commands

For tests that need to modify WildFly configuration:

```typescript
import { executeCliCommand } from "../../utils/wildfly-container.js";

test("reads a system property", async ({ wildfly, basePage }) => {
  await executeCliCommand(wildfly, '/system-property=foo:add(value="bar")');
  // Now test that the UI reflects the change
});
```

## Test Structure Patterns

### Basic Test

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "category/feature" });

test.describe("Feature Name", { tag: [Tag.SMOKE] }, () => {
  test("does something specific", async ({ somePage }) => {
    await expect(somePage.someElement).toBeVisible();
  });
});
```

### Multiple Tests Sharing State

Tests within a `describe` block share the same WildFly container but get fresh page objects:

```typescript
test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
  test("shows heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });

  test("shows overview section", async ({ dashboardPage }) => {
    // Fresh dashboardPage — independent from the test above
    await expect(dashboardPage.overviewSection).toBeVisible();
  });
});
```

### Data-Driven Tests

Loop over test data to generate multiple tests:

```typescript
import { NAV_ITEM_NAMES } from "../../pages/navigation.page.js";

for (const item of NAV_ITEM_NAMES) {
  test(`navigates to ${item}`, async ({ navigationPage }) => {
    await navigationPage.navigateTo(item);
    await expect(navigationPage.page.locator(`#${MAIN_ID}`)).toBeVisible();
  });
}
```

### Test Without Page Objects

For simple checks that don't need the full page object machinery:

```typescript
import { test, expect } from "../../fixtures/wildfly.fixture.js";

test("halOP serves the SPA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/hal/i);
});
```

Note the import from `wildfly.fixture.js` instead of `pages.fixture.js`.

## Creating a New Page Object

When testing a new section of halOP, create a page object to encapsulate its locators and actions.

### Step 1: Create the Page Object Class

Create `src/pages/runtime.page.ts`:

```typescript
import type { Locator, Page } from "@playwright/test";
import { MAIN_ID, NAV_RUNTIME } from "../selectors/ids.js";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

export class RuntimePage extends BasePage {
  readonly heading: Locator;
  readonly serverStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(`#${MAIN_ID}`).getByRole("heading", { name: "Runtime", level: 1 });
    this.serverStatus = page.getByText("RUNNING", { exact: true });
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_RUNTIME)).click();
    await this.page.locator(`#${MAIN_ID}`).waitFor({ state: "visible" });
  }
}
```

**Guidelines:**

- Extend `BasePage` — it gives you the `page` property
- Define locators as `readonly` properties in the constructor
- Use OUIA selectors (`ouiaSelector()`) for halOP-specific elements
- Use Playwright's semantic locators (`getByRole`, `getByText`) for standard HTML elements
- Keep navigation in a `navigate()` method — the fixture calls it for you
- Don't store URLs or infrastructure details — that's the fixture's job

### Step 2: Register the Fixture

Edit `src/fixtures/pages.fixture.ts`:

```typescript
// Add the import
import { RuntimePage } from "../pages/runtime.page.js";

// Add to the interface
interface PageFixtures {
  // ...existing entries...
  runtimePage: RuntimePage;
}

// Add the fixture
export const test = testWithWildFly.extend<PageFixtures>({
  // ...existing entries...

  runtimePage: async ({ page, wildfly }, use) => {
    await openHalOp(page, wildfly.managementUrl);
    const runtimePage = new RuntimePage(page);
    await runtimePage.navigate();
    await use(runtimePage);
  },
});
```

The fixture pattern is always the same:

1. `openHalOp(page, wildfly.managementUrl)` — load halOP and connect to WildFly
2. Create the page object
3. Optionally call `navigate()` — if the page object has a specific section to navigate to
4. `await use(pageObject)` — hand it to the test

### Step 3: Write Tests

Create `src/tests/runtime/runtime.spec.ts`:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "runtime/runtime" });

test.describe("Runtime", { tag: [Tag.SMOKE] }, () => {
  test("shows runtime heading", async ({ runtimePage }) => {
    await expect(runtimePage.heading).toBeVisible();
  });

  test("shows server status", async ({ runtimePage }) => {
    await expect(runtimePage.serverStatus).toBeVisible();
  });
});
```

### Step 4: Add a Tag (Optional)

If this is a new test group, add an entry to `src/tags.ts`:

```typescript
export const Tag = {
  // ...existing tags...
  RUNTIME: { value: "@runtime", description: "Runtime feature" },
} as const satisfies Record<string, TagDefinition>;
```

That's it — `pnpm test:tag runtime` works automatically. No other files need changes.

## Debugging Tests

### Run a Single Test

```bash
# By file
pnpm test -- src/tests/smoke/dashboard.spec.ts

# By name pattern
pnpm test -- --grep "shows dashboard heading"

# In a single browser
pnpm test -- --project=chromium src/tests/smoke/dashboard.spec.ts
```

### Headed Mode (See the Browser)

```bash
pnpm test:headed -- src/tests/smoke/dashboard.spec.ts
```

### Debug Mode (Step Through)

```bash
pnpm test:debug -- src/tests/smoke/dashboard.spec.ts
```

This opens the Playwright Inspector where you can step through actions, inspect the DOM, and see what locators match.

### UI Mode (Interactive)

```bash
pnpm test:ui
```

Opens Playwright's interactive UI with a file browser, test runner, and time-travel debugging. Great for developing new tests.

### View the Report

After a test run:

```bash
pnpm report
```

Opens the HTML report showing all passed/failed tests with traces, screenshots, and error details.

## Common Patterns in This Project

### Checking Multiple Sections Exist

```typescript
test("shows host and JVM info", async ({ dashboardPage }) => {
  await expect(dashboardPage.hostSection).toBeVisible();
  await expect(dashboardPage.jvmSection).toBeVisible();
});
```

### Verifying Navigation Works

```typescript
test("navigates to Configuration", async ({ navigationPage }) => {
  await navigationPage.navigateTo("Configuration");
  await expect(navigationPage.page.locator(`#${MAIN_ID}`)).toBeVisible();
});
```

### Tree Navigation

```typescript
test("navigates to a specific subsystem", async ({ modelBrowserPage }) => {
  await modelBrowserPage.navigateToChild("subsystem", "datasources");
  await expect(modelBrowserPage.resourceHeading).toContainText("datasources");
});
```

### Tab Switching

```typescript
test("switches tabs", async ({ modelBrowserPage }) => {
  await modelBrowserPage.selectTab("Operations");
  await expect(modelBrowserPage.tabPanel("Operations")).toBeVisible();
});
```

### Checking a Modal Opens and Closes

```typescript
test("opens and closes find modal", async ({ modelBrowserPage }) => {
  await modelBrowserPage.findButton.click();
  await expect(modelBrowserPage.findResourceModal).toBeVisible();
  await modelBrowserPage.findResourceCancelButton.click();
  await expect(modelBrowserPage.findResourceModal).toBeHidden();
});
```

## Checklist for New Tests

Before submitting a PR:

- [ ] Test file imports `test` and `expect` from the correct fixture (not from `@playwright/test`)
- [ ] `test.use({ specPath: "..." })` is set (matches the file path convention)
- [ ] Tests are wrapped in `test.describe()` with appropriate tags
- [ ] Page objects are used instead of raw selectors where possible
- [ ] Assertions use `await expect(locator)` (not plain `expect(value)`) for auto-waiting
- [ ] Tests pass in all three browsers: `pnpm test -- --project=chromium`, `firefox`, `webkit`
- [ ] Code passes linting: `pnpm lint` and `pnpm format:check`
