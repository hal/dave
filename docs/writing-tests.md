# Writing Tests

This guide walks you through writing tests for dave — from your first test to preparing the management model. It's written for contributors who may be new to Playwright. For Playwright-specific terminology, see the [Glossary](glossary.md). For a deep dive into how fixtures work, see [Fixtures and Dependency Injection](fixtures.md).

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

## Requesting Fixtures

List any combination of fixtures in your test function parameters:

```typescript
test("example", async ({ page, wildfly, dashboardPage, navigationPage }) => {
  // Use whichever you need
});
```

The `page` and `wildfly` fixtures are always available:

| Fixture   | What you get                                                 |
| --------- | ------------------------------------------------------------ |
| `page`    | Playwright's `Page` — the browser tab (OUIA already enabled) |
| `wildfly` | The WildFly container — `httpUrl` and `managementUrl`        |

Page objects (like `dashboardPage`, `navigationPage`, `configurationPage`, etc.) are registered in [`src/fixtures/pages.fixture.ts`](https://github.com/hal/dave/blob/main/src/fixtures/pages.fixture.ts). Check that file for the current list. Each fixture opens halOP, optionally navigates to a section, and hands you a ready-to-use page object.

Fixtures are **lazy** — only the ones you list in the parameters are created. If you only need `navigationPage`, the other page fixtures never run.

## Writing Assertions

Playwright provides two main assertion styles:

### Element Assertions (Most Common)

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

## Preparing the Management Model

Some tests need specific management model resources to exist before they run — for example, testing a subsystem configuration form that requires a remote cache container or an outbound socket binding to be in place. Use `test.beforeAll()` to set up these resources after the WildFly container is ready but before any test in the file executes.

### Basic Setup

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { addResource, removeResource } from "../../utils/dmr.js";

test.use({ specPath: "configuration/distributable-web" });

test.beforeAll(async ({ wildfly }) => {
  await addResource(wildfly.managementUrl, ["system-property", "my-prop"], { value: "test-value" });
});

test.afterAll(async ({ wildfly }) => {
  await removeResource(wildfly.managementUrl, ["system-property", "my-prop"]);
});

test.describe("Distributable Web Configuration", () => {
  test("uses the pre-configured resource", async ({ configurationPage }) => {
    // The resource already exists — test the UI
  });
});
```

The `wildfly` fixture is worker-scoped, so it's available in `beforeAll` and `afterAll` hooks. The container is started before `beforeAll` runs and stopped after `afterAll` completes.

### Multi-Step Setup

When resources depend on each other, add them in order:

```typescript
const outboundSocket = { name: "custom-obs", host: "localhost", port: "15099" };
const cacheContainer = { name: "rcc-test", defaultCluster: "rc-test" };

test.beforeAll(async ({ wildfly }) => {
  const url = wildfly.managementUrl;

  // 1. Create the outbound socket binding
  await addResource(
    url,
    ["socket-binding-group", "standard-sockets", "remote-destination-outbound-socket-binding", outboundSocket.name],
    { host: outboundSocket.host, port: outboundSocket.port },
  );

  // 2. Create the remote cache container (depends on the socket binding)
  await addResource(url, ["subsystem", "infinispan", "remote-cache-container", cacheContainer.name], {
    "default-remote-cluster": cacheContainer.defaultCluster,
  });

  // 3. Create the remote cluster (depends on the cache container)
  await addResource(
    url,
    [
      "subsystem",
      "infinispan",
      "remote-cache-container",
      cacheContainer.name,
      "remote-cluster",
      cacheContainer.defaultCluster,
    ],
    { "socket-bindings": [outboundSocket.name] },
  );
});
```

### When to Use `beforeAll` vs. In-Test Setup

| Approach                           | When to use                                                   |
| ---------------------------------- | ------------------------------------------------------------- |
| `test.beforeAll()`                 | Resources are **prerequisites** — the test assumes they exist |
| In-test setup (like the CRUD test) | Creating the resource **is** the test                         |

The CRUD test in `src/tests/model-browser/crud.spec.ts` is an example of in-test setup: creating, reading, updating, and deleting a system property is the test itself. In contrast, a distributable-web configuration test needs remote cache containers to already exist so it can test the configuration UI.

### Cleanup

Since each spec file gets its own WildFly container that is destroyed after all tests complete, `afterAll` cleanup is technically optional. However, it's good practice for two reasons:

1. **Serial tests** — if tests within a `test.describe.serial()` block depend on a clean state, earlier test side effects can cause failures.
2. **Readability** — `afterAll` documents what the test created, making the test's footprint explicit.

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

## Checklist for New Tests

Before submitting a PR:

- [ ] Test file imports `test` and `expect` from the correct fixture (not from `@playwright/test`)
- [ ] `test.use({ specPath: "..." })` is set (matches the file path convention)
- [ ] Tests are wrapped in `test.describe()` with appropriate tags
- [ ] Page objects are used instead of raw selectors where possible
- [ ] Assertions use `await expect(locator)` (not plain `expect(value)`) for auto-waiting
- [ ] Tests pass in all three browsers: `pnpm test -- --project=chromium`, `firefox`, `webkit`
- [ ] Code passes linting: `pnpm lint` and `pnpm format:check`

## Related Guides

- **[Finding Elements](finding-elements.md)** — OUIA IDs, Playwright locators, and scoping strategies
- **[Test Patterns](test-patterns.md)** — common test structures, actions, and copy-paste recipes
- **[Page Objects](page-objects.md)** — creating new page objects and registering fixtures
- **[Fixtures](fixtures.md)** — deep dive into the four-layer fixture system

## Claude Code Skills

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code), dave includes skills that automate parts of this workflow:

- **`/hal-explore`** — identifies untested halOP features by cross-referencing the halOP source tree with existing tests and page objects. Use it to find out _what_ to test next.
- **`/hal-implement`** — generates tests and page objects following the conventions described in this guide, via an interactive propose-approve-implement loop.

See [Skills](skills.md) for full documentation.
