# Fixtures and Dependency Injection

This document explains how tests in this project get their dependencies — WildFly containers, browser pages, and page objects — automatically injected. If you're writing a new test, this is the guide to understand what's available and where it comes from.

## How Fixtures Work (The Short Version)

When you write a test, you list what you need in the function parameters. Playwright creates those objects for you:

```typescript
test("shows dashboard heading", async ({ dashboardPage }) => {
  // dashboardPage is already created, halOP is open, page is navigated
  await expect(dashboardPage.heading).toBeVisible();
});
```

You never call `new DashboardPage()` or start containers yourself. The **fixture system** does it.

## The Four Layers

The fixture chain has four layers, each building on the previous one:

```mermaid
flowchart TB
    L1["Layer 1: Global Setup\nstarts halOP container\n(once for entire test run)"]
    L2["Layer 2: Playwright Config\nsets base URL, browsers, worker count"]
    L3["Layer 3: WildFly Fixture\nstarts one WildFly container per spec file\n(worker-scoped)"]
    L4["Layer 4: Page Fixtures\ncreates page objects for each test\n(test-scoped)"]

    L1 --> L2 --> L3 --> L4

    style L1 fill:#e8f4fd,stroke:#2196f3
    style L2 fill:#e0f2f1,stroke:#009688
    style L3 fill:#fff3e0,stroke:#ff9800
    style L4 fill:#f3e5f5,stroke:#9c27b0
```

### Layer 1: Global Setup (`global-setup.ts`)

Runs **once** before any test starts. It:

1. Removes leftover containers from previous runs (anything named `dave_*`)
2. Starts the **halOP container** (the management console SPA)
3. Writes the container ID and port to `/tmp/dave-state.json`
4. Sets `HALOP_URL` environment variable (e.g., `http://localhost:9090`)

After all tests finish, `global-teardown.ts` stops the halOP container and cleans up.

### Layer 2: Playwright Config (`playwright.config.ts`)

Configures Playwright with:

- `baseURL`: set to `HALOP_URL` — all `page.goto("/")` calls resolve against this
- Three browser projects: `chromium`, `firefox`, `webkit`
- 4 parallel workers locally, 2 in CI
- References to global setup/teardown

### Layer 3: WildFly Fixture (`src/fixtures/wildfly.fixture.ts`)

Extends Playwright's base `test` with a **worker-scoped** WildFly container:

```typescript
interface WildFlyWorkerFixtures {
  specPath: string; // set by test files via test.use()
  wildfly: WildFlyContainer; // the running container
}
```

**How it works:**

1. Each spec file sets `specPath` via `test.use({ specPath: "smoke/dashboard" })`
2. The fixture derives a container name: `dave_smoke_dashboard_chromium`
3. It starts a WildFly container (image, ports, healthcheck wait)
4. The `wildfly` object is available to all tests in that worker
5. After all tests in the worker finish, the container is stopped

Because the scope is `worker`, the container is shared across all tests in the same spec file — it's not restarted between individual tests.

**The `WildFlyContainer` object provides:**

```typescript
interface WildFlyContainer {
  container: StartedTestContainer; // the testcontainers handle
  httpUrl: string; // http://localhost:<mapped-8080> — for deployments
  managementUrl: string; // http://localhost:<mapped-9990> — for management API
}
```

### Layer 4: Page Fixtures (`src/fixtures/pages.fixture.ts`)

Extends the WildFly fixture with **test-scoped** page objects:

```typescript
interface PageFixtures {
  basePage: BasePage;
  configurationPage: ConfigurationPage;
  dashboardPage: DashboardPage;
  modelBrowserPage: ModelBrowserPage;
  navigationPage: NavigationPage;
  tasksPage: TasksPage;
}
```

**What each fixture does before handing you the page object:**

1. Enables OUIA attributes (sets `localStorage.ouia = "true"` via `page.addInitScript`)
2. Navigates to halOP with the WildFly connection parameter: `/?connect=<managementUrl>`
3. Waits for the main content area to be visible
4. Creates the page object
5. Some page objects call `navigate()` to reach their specific section (e.g., Configuration, Model Browser)

Because the scope is `test`, you get a **fresh page object** for every test — even if the tests share a WildFly container.

## What's Available in Tests

### Importing from `pages.fixture.ts` (most tests)

When you import `test` from `pages.fixture.ts`, you get everything:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";

test.use({ specPath: "smoke/dashboard" });

test("example", async ({ page, wildfly, dashboardPage }) => {
  // page          — Playwright's Page (with OUIA enabled)
  // wildfly       — the WildFly container (httpUrl, managementUrl)
  // dashboardPage — the DashboardPage object (halOP already open)
});
```

Available fixtures:

| Fixture             | Type                | Scope  | Pre-navigated to      |
| ------------------- | ------------------- | ------ | --------------------- |
| `page`              | Playwright `Page`   | test   | (OUIA enabled)        |
| `wildfly`           | `WildFlyContainer`  | worker | n/a                   |
| `basePage`          | `BasePage`          | test   | halOP root            |
| `dashboardPage`     | `DashboardPage`     | test   | halOP root            |
| `navigationPage`    | `NavigationPage`    | test   | halOP root            |
| `configurationPage` | `ConfigurationPage` | test   | Configuration section |
| `modelBrowserPage`  | `ModelBrowserPage`  | test   | Model Browser section |
| `tasksPage`         | `TasksPage`         | test   | Tasks section         |

### Importing from `wildfly.fixture.ts` (simple tests)

For tests that don't need page objects (e.g., just checking halOP loads):

```typescript
import { test, expect } from "../../fixtures/wildfly.fixture.js";

test("halOP serves the SPA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/hal/i);
});
```

This gives you `page` and the Playwright built-ins, but no page objects and no WildFly container (unless you explicitly destructure `wildfly`).

## The Full Lifecycle

Here's what happens when you run a test like this:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
test.use({ specPath: "smoke/dashboard" });

test("shows dashboard heading", async ({ dashboardPage }) => {
  await expect(dashboardPage.heading).toBeVisible();
});
```

```mermaid
sequenceDiagram
    participant GS as global-setup.ts
    participant WF as wildfly.fixture.ts
    participant PF as pages.fixture.ts
    participant T as Test Function
    participant GT as global-teardown.ts

    Note over GS: 1. PROCESS START
    activate GS
    GS->>GS: Remove stale dave_* containers
    GS->>GS: Start halOP container on port 9090
    GS->>GS: Set HALOP_URL=http://localhost:9090
    deactivate GS

    Note over WF: 2. WORKER START (one per spec file x browser)
    activate WF
    WF->>WF: Read specPath: "smoke/dashboard"
    WF->>WF: Derive name: "dave_smoke_dashboard_chromium"
    WF->>WF: Start WildFly container (dynamic ports)
    WF->>WF: Wait for healthcheck to pass

    loop For each test in the spec file
        Note over PF: 3. TEST START
        activate PF
        PF->>PF: Enable OUIA via addInitScript
        PF->>PF: Navigate to /?connect=localhost:<mgmt-port>
        PF->>PF: Wait for #hal-root-container
        PF->>PF: Create DashboardPage(page)

        activate T
        Note over T: 4. Test runs with ready dashboardPage
        deactivate T

        Note over PF: 5. TEST END
        PF->>PF: Clean up page object and page
        deactivate PF
    end

    Note over WF: 6. WORKER END
    WF->>WF: Stop WildFly container
    deactivate WF

    Note over GT: 7. PROCESS END
    activate GT
    GT->>GT: Stop halOP container
    GT->>GT: Remove /tmp/dave-state.json
    deactivate GT
```

## Lazy Evaluation

Fixtures are **lazy** — they're only created if the test actually requests them. If your test only uses `{ dashboardPage }`, the `configurationPage` fixture never runs. This means:

- No unnecessary navigation
- No wasted setup time
- You only pay for what you use

## The `use()` Pattern

Every fixture follows the same pattern:

```typescript
myFixture: async ({ dependencies }, use) => {
  // SETUP — runs before the test
  const thing = await createThing();

  await use(thing); // ← hand the object to the test; test runs here

  // TEARDOWN — runs after the test
  await cleanupThing(thing);
};
```

The `use()` call is the boundary: setup above, teardown below. Playwright guarantees teardown runs even if the test fails.

## Fixture Dependency Chain

Fixtures can depend on other fixtures. The chain in this project:

```mermaid
flowchart TB
    pw["Playwright built-in: page"]
    ouia["pages.fixture.ts: page (enhanced with OUIA)"]
    wf["wildfly.fixture.ts: wildfly (depends on specPath)"]
    dp["pages.fixture.ts: dashboardPage (depends on page + wildfly)"]
    test["test function: receives dashboardPage"]

    pw --> ouia --> dp
    wf --> dp --> test

    style pw fill:#e8f4fd,stroke:#2196f3
    style ouia fill:#e0f2f1,stroke:#009688
    style wf fill:#fff3e0,stroke:#ff9800
    style dp fill:#f3e5f5,stroke:#9c27b0
    style test fill:#e8f5e9,stroke:#4caf50
```

Playwright resolves the dependency graph automatically. When you request `dashboardPage`, Playwright knows it needs `page` and `wildfly` first, creates them in order, and tears them down in reverse order.
