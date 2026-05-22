# Glossary

Key terms used throughout this project and in Playwright testing.

## Playwright Concepts

### Fixture

A **fixture** is Playwright's dependency injection mechanism. It provides objects to your tests — you list what you need in the test function's parameter list, and Playwright creates, sets up, and tears down those objects automatically.

```typescript
// { page } is a built-in fixture — Playwright creates a fresh browser page for each test
test("example", async ({ page }) => {
  await page.goto("/");
});
```

Fixtures can be **built-in** (provided by Playwright) or **custom** (defined by you). This project defines custom fixtures for WildFly containers and page objects.

### Built-in Fixtures

Playwright provides several fixtures out of the box. The ones relevant to this project:

| Fixture       | What it provides                                     |
| ------------- | ---------------------------------------------------- |
| `page`        | A fresh browser page (tab) for each test             |
| `browser`     | The shared browser instance for the worker           |
| `browserName` | The current browser: `"chromium"`, `"firefox"`, etc. |
| `request`     | An API request context for making HTTP calls         |

See the [Playwright docs](https://playwright.dev/docs/test-fixtures#built-in-fixtures) for the full list.

### Fixture Scope

Fixtures have a **scope** that determines their lifetime:

- **`test` scope** (default) — a fresh instance is created for every single test. Example: `page`, page objects.
- **`worker` scope** — one instance is shared across all tests running in the same worker process. Example: WildFly containers.

Worker-scoped fixtures are expensive to create, so they're shared. Test-scoped fixtures are cheap and ensure test isolation.

### `test.extend<T>()`

The method used to add custom fixtures to Playwright's `test` object. You define an interface for your fixtures and provide factory functions that create them:

```typescript
interface MyFixtures {
  greeting: string;
}

const myTest = test.extend<MyFixtures>({
  greeting: async ({}, use) => {
    await use("hello"); // provide the value to the test
  },
});
```

The `use` callback is key — code before `use()` is **setup**, code after is **teardown**.

### `test.use()`

Configures fixture options for a test file or `describe` block. In this project, it's used to set the `specPath` which determines the WildFly container name:

```typescript
test.use({ specPath: "smoke/navigation" });
```

### Locator

A Playwright object that represents a way to find element(s) on the page. Locators are **lazy** — they don't search the DOM until you perform an action or assertion. They auto-wait and auto-retry.

```typescript
// These are all locators — no DOM query happens yet
const button = page.getByRole("button", { name: "Submit" });
const heading = page.locator("h1");

// DOM query + action happens here
await button.click();
await expect(heading).toBeVisible();
```

### Page

Playwright's representation of a browser tab. Provides methods to navigate, find elements, take screenshots, and interact with the page.

### Project

A named browser configuration in `playwright.config.ts`. This project defines three: `chromium`, `firefox`, and `webkit`. Each test runs in all three projects by default.

### Worker

An OS process that runs a subset of tests in parallel. Each worker gets its own browser instance. This project uses 4 workers locally and 2 in CI.

## Project-Specific Concepts

### Page Object (POM)

A class that encapsulates the locators and actions for a specific page or section of the UI. Tests interact with page objects instead of writing raw selectors:

```typescript
// Without POM — fragile, hard to maintain
await page.locator('[data-ouia-component-id="nav-dashboard"]').click();

// With POM — readable, reusable
await navigationPage.navigateTo("Dashboard");
```

All page objects extend `BasePage` and receive a `Page` in their constructor.

### OUIA

**Open UI Automation** — a convention from the PatternFly component library. Components render `data-ouia-component-id` attributes in the DOM, providing stable selectors for testing. This project uses OUIA IDs as the primary way to locate elements.

### halOP

The WildFly management console (an SPA) that this test suite exercises. It runs as a container and connects to WildFly instances via their management API.

### WildFly Container

A Docker/Podman container running a WildFly application server. Each test file gets its own isolated WildFly instance, started via the `testcontainers` library. The container exposes two ports:

- **HTTP** (8080) — for deployment testing
- **Management** (9990) — for the management API that halOP connects to

### testcontainers

A library that manages Docker/Podman containers programmatically from test code. This project uses it to start both halOP and WildFly containers.

### Global Setup / Teardown

Playwright hooks that run once before all tests start and once after all tests finish. This project uses them to manage the shared halOP container.

### Spec File

A test file (ending in `.spec.ts`). In this project, each spec file gets its own WildFly container, ensuring complete isolation between test files.

### Tag

A label attached to a test group (via `test.describe`) that allows filtering which tests to run. Defined in `src/tags.ts`. Examples: `@smoke`, `@dashboard`, `@navigation`.
