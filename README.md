# dave

> _"Look Dave, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."_
> — HAL 9000, _2001: A Space Odyssey_

Named after astronaut Dave Bowman, the only one who could keep HAL in check. In the same spirit, **dave** keeps an eye on [halOP](https://github.com/hal/foundation) — the WildFly management console — making sure it behaves as expected.

dave is the UI test suite for [halOP](https://github.com/hal/foundation), the WildFly management console. Built with [Playwright](https://playwright.dev/) and TypeScript.

dave automatically starts a [WildFly server](https://quay.io/repository/wado/wado-sa?tab=info) and [halOP container](https://quay.io/repository/halconsole/hal-op?tab=info), runs end-to-end tests against the management console, and tears everything down when finished.

## Prerequisites

- **Node.js** 22+
- **pnpm** (corepack-enabled, see `packageManager` in `package.json`)
- **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)** — runs WildFly and halOP containers (auto-detected)

## Getting Started

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium firefox webkit

# Run all tests (headless)
pnpm test
```

## Running Tests

| Command                   | Description                           |
| ------------------------- | ------------------------------------- |
| `pnpm test`               | Run all tests headless (all browsers) |
| `pnpm test:headed`        | Run with a visible browser window     |
| `pnpm test:ui`            | Playwright interactive UI mode        |
| `pnpm test:debug`         | Debug mode with Playwright inspector  |
| `pnpm report`             | Open the last HTML test report        |
| `pnpm allure:generate`    | Generate Allure report from results   |
| `pnpm allure:serve`       | Serve Allure report with live reload  |
| `pnpm allure:open`        | Open a generated Allure report        |
| `pnpm test:smoke`         | Run only `@smoke` tests               |
| `pnpm test:navigation`    | Run only `@navigation` tests          |
| `pnpm test:dashboard`     | Run only `@dashboard` tests           |
| `pnpm test:configuration` | Run only `@configuration` tests       |
| `pnpm test:tasks`         | Run only `@tasks` tests               |
| `pnpm test:model-browser` | Run only `@model-browser` tests       |

Filter tests by pattern, file, or browser:

```bash
pnpm test -- --grep "dashboard"
pnpm test -- src/tests/smoke/app-loads.spec.ts
pnpm test -- --project=chromium
pnpm test -- --project=firefox
pnpm test -- --project=webkit
```

### Test Groups

Tests are tagged by feature area using [Playwright's tag API](https://playwright.dev/docs/test-annotations#tag-tests). Tags are defined as typed constants in [`src/tags.ts`](src/tags.ts).

| Tag              | Group                 | Test Files                             |
| ---------------- | --------------------- | -------------------------------------- |
| `@smoke`         | Smoke tests           | `app-loads`, `dashboard`, `navigation` |
| `@navigation`    | Navigation feature    | `navigation`                           |
| `@dashboard`     | Dashboard feature     | `dashboard`                            |
| `@configuration` | Configuration feature | `configuration`                        |
| `@tasks`         | Tasks feature         | `tasks`                                |
| `@model-browser` | Model browser feature | `model-browser`                        |

Tests can belong to multiple groups. Combine groups with OR logic:

```bash
pnpm test -- --grep "@smoke|@model-browser"
```

Exclude a group:

```bash
pnpm test -- --grep-invert @smoke
```

Tags are displayed in the [Playwright](https://hal.github.io/dave/reports/playwright/) and [Allure](https://hal.github.io/dave/reports/allure/) reports and can be used to filter results.

To add a new group, add a constant to `src/tags.ts` and apply it to test files via the `tag` option on `test.describe()`.

## Configuration

Environment variables can be set in a `.env` file (see [`.env.example`](.env.example)):

| Variable        | Default                                | Description                             |
| --------------- | -------------------------------------- | --------------------------------------- |
| `WILDFLY_IMAGE` | `quay.io/wado/wado-sa:development`     | WildFly container image                 |
| `HALOP_IMAGE`   | `quay.io/halconsole/hal-op:test-suite` | halOP container image                   |
| `HALOP_PORT`    | `9090`                                 | Host port mapped to the halOP container |

### Container Images

| Image                                                                                           | Description                            |
| ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| [`quay.io/halconsole/hal-op:test-suite`](https://quay.io/repository/halconsole/hal-op?tab=tags) | halOP image used by the test suite     |
| [`quay.io/wado/wado-sa:development`](https://quay.io/repository/wado/wado-sa?tab=tags)          | WildFly image used for test containers |

### Related Projects

| Project                                            | Description                                             |
| -------------------------------------------------- | ------------------------------------------------------- |
| [halOP](https://github.com/hal/foundation)         | WildFly management console (the application under test) |
| [WildFly](https://www.wildfly.org/)                | The application server managed by halOP                 |
| [testcontainers](https://node.testcontainers.org/) | Container management for integration tests              |

## How It Works

### Test Lifecycle

```
global-setup.ts              starts halOP container
                              writes state to /tmp/dave-state.json
                              sets HALOP_URL env var

  worker-scoped fixture       starts a WildFly container per worker
                              (via testcontainers)
  src/fixtures/wildfly.fixture.ts  WildFly container lifecycle (worker-scoped)
  src/fixtures/pages.fixture.ts   enables OUIA, navigates to halOP, creates page objects
  src/tests/**/*.spec.ts        test execution
  worker teardown             stops the WildFly container

global-teardown.ts            stops halOP container, cleans state file
```

Spec files run **in parallel** across multiple workers (4 locally, 2 in CI). Tests within a spec file are sequential. Each test file gets its own isolated WildFly container per browser project via a worker-scoped Playwright fixture backed by [testcontainers](https://node.testcontainers.org/). Tests run in Chromium, Firefox, and WebKit.

### WildFly Container Fixture

WildFly containers are managed by a **worker-scoped Playwright fixture** defined in [`src/fixtures/wildfly.fixture.ts`](src/fixtures/wildfly.fixture.ts). Spec files that need WildFly and page objects import `test` from `pages.fixture.ts` and declare their spec path:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";

test.use({ specPath: "smoke/dashboard" });
```

The fixture starts a container before any test in the worker runs and stops it after the last test finishes. Container names follow the pattern `dave_<path>_<project>` (e.g., `dave_smoke_dashboard_chromium`). Ports are dynamically allocated.

Spec files that don't need WildFly (e.g., `app-loads.spec.ts`) import `test` and `expect` from `wildfly.fixture.ts`.

### Page Object Model

Custom Playwright fixtures in [`src/fixtures/pages.fixture.ts`](src/fixtures/pages.fixture.ts) provide page objects to each test. Page objects are pure UI concerns (locators and actions) — they don't know about WildFly URLs or infrastructure. The fixture layer handles navigation via `openHalOp(page, managementUrl)` before handing each page object to the test, so tests receive ready-to-use pages:

| Fixture            | Purpose                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `basePage`         | Base page with shared `page` accessor                                     |
| `dashboardPage`    | Dashboard heading assertions                                              |
| `modelBrowserPage` | Model browser tree and resource assertions                                |
| `navigationPage`   | Sidebar navigation (Dashboard, Deployments, Configuration, Runtime, etc.) |

Tests import `test` and `expect` from `../fixtures/pages.fixture` instead of `@playwright/test`.

### Element Identification

Tests use [OUIA](https://ouia.readthedocs.io/) attributes for element selection, following [PatternFly's](https://www.patternfly.org/developer-resources/open-ui-automation) testing conventions. The OUIA component IDs are generated locally from halOP's [`Ids.java`](https://github.com/hal/foundation/blob/main/ui/src/main/java/org/jboss/hal/ui/Ids.java) source file into [`src/selectors/ids.ts`](src/selectors/ids.ts). Run `pnpm sync:ouia` to regenerate after upstream changes — no npm release required.

### Adding a New Page Object

1. Create `src/pages/foo.page.ts` extending `BasePage`:

   ```typescript
   import type { Page } from "@playwright/test";
   import { BasePage } from "./base.page.js";

   export class FooPage extends BasePage {
     constructor(page: Page) {
       super(page);
     }
   }
   ```

2. Register the fixture in `src/fixtures/pages.fixture.ts` — add the import, the interface entry, and the fixture:

   ```typescript
   import { FooPage } from "../pages/foo.page.js";

   interface PageFixtures {
     // ...existing entries...
     fooPage: FooPage;
   }

   export const test = testWithWildFly.extend<PageFixtures>({
     // ...existing entries...
     fooPage: async ({ page, wildfly }, use) => {
       await openHalOp(page, wildfly.managementUrl);
       await use(new FooPage(page));
     },
   });
   ```

No other files need to change. OUIA enablement and navigation are handled by `pages.fixture.ts`, WildFly container lifecycle by `wildfly.fixture.ts`.

### Adding a New Test

Create a spec file under `src/tests/` and import from the appropriate fixture:

- **With WildFly + page objects** — import from `pages.fixture.ts`:

  ```typescript
  import { test, expect } from "../../fixtures/pages.fixture.js";
  import { Tag } from "../../tags.js";

  test.use({ specPath: "category/foo" });

  test.describe("Foo", { tag: [Tag.SMOKE] }, () => {
    test("does something", async ({ fooPage }) => {
      // page is already navigated — start asserting...
    });
  });
  ```

- **Without WildFly** — import from `wildfly.fixture.ts`:

  ```typescript
  import { test, expect } from "../../fixtures/wildfly.fixture.js";
  ```

To add a new test group, add a constant to `src/tags.ts` and optionally a pnpm script to `package.json`.

## Keeping dave in Sync

dave depends on two upstream artifacts from halOP: OUIA ID constants and the `hal-op:test-suite` container image. Three sync commands keep everything up to date:

| Command            | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm sync:ouia`   | Fetch `Ids.java` from GitHub and regenerate `src/selectors/ids.ts` |
| `pnpm sync:image`  | Pull the latest `hal-op:test-suite` container image                |
| `pnpm sync:status` | Check sync state and report what needs updating                    |
| `pnpm sync:help`   | Show sync command help                                             |

### Typical workflow

```bash
# Check if everything is up to date
pnpm sync:status

# If OUIA IDs are out of date
pnpm sync:ouia

# If the container image is out of date (or a new build just finished)
pnpm sync:image

# Run tests
pnpm test
```

`sync:status` checks three things and prints a verdict:

1. **OUIA IDs** — compares local `src/selectors/ids.ts` against upstream `Ids.java`
2. **CI build** — queries the halOP `test-suite.yml` workflow for the latest run status
3. **Container image** — compares local image digest against the remote registry

If everything is current, you'll see "Ready to test". Otherwise it tells you exactly what to run.

## Project Structure

```
dave/
  global-setup.ts              # Start halOP before tests
  global-teardown.ts           # Stop halOP after tests
  playwright.config.ts         # Playwright configuration
  scripts/
    lib/
      parse-ids.ts             # Shared Ids.java parsing logic
    sync-ouia.ts               # Generate OUIA ID constants from GitHub
    sync-image.ts              # Pull halOP container image
    sync-status.ts             # Check sync state and report verdict
  src/
    fixtures/
      wildfly.fixture.ts       # WildFly container lifecycle (worker-scoped)
      pages.fixture.ts         # OUIA enablement, navigation, page object registry
    pages/
      base.page.ts             # Base page object
      dashboard.page.ts        # Dashboard page object
      model-browser.page.ts    # Model browser page object
      navigation.page.ts       # Navigation page object
    selectors/
      ids.ts                   # Generated OUIA ID constants (do not edit)
    tags.ts                    # Tag constants for test grouping
    tests/
      smoke/                   # Smoke tests
        app-loads.spec.ts
        dashboard.spec.ts
        navigation.spec.ts
      model-browser/           # Model browser tests
        model-browser.spec.ts
    utils/
      configure-testcontainers.ts  # Testcontainers config
      container-runtime.ts         # Auto-detect Podman or Docker
      ouia.ts                      # OUIA attribute selector helper
      wildfly-container.ts         # WildFly container lifecycle
```

## Code Quality

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `pnpm lint`         | Run ESLint                        |
| `pnpm lint:fix`     | Run ESLint with auto-fix          |
| `pnpm format`       | Format all files with Prettier    |
| `pnpm format:check` | Check formatting without changing |

ESLint is configured with TypeScript and [Playwright-specific](https://github.com/playwright-community/eslint-plugin-playwright) rules. Prettier handles all formatting. See `eslint.config.js` and `.prettierrc` for details.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow  | Trigger                                                    | What it does                                                                                           |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Lint**  | Push / PR to `main`                                        | Checks formatting (Prettier) and linting (ESLint)                                                      |
| **Smoke** | Push / PR to `main`                                        | Runs `@smoke` tests in Chromium only — fast pass/fail gate, no reports                                 |
| **Test**  | Push to `main` (path-filtered), daily at 05:00 UTC, manual | Full suite across Chromium, Firefox, and WebKit; uploads artifacts and deploys reports to GitHub Pages |

The **Test** workflow only triggers on pushes to `main` that change test or config files (`src/**`, `playwright.config.ts`, `global-setup.ts`, `global-teardown.ts`, `package.json`, `pnpm-lock.yaml`). A daily schedule catches regressions from upstream WildFly or halOP image changes. It can also be triggered manually via `workflow_dispatch`.

The latest test reports from `main` are published to **[GitHub Pages](https://hal.github.io/dave/)**:

- [Playwright report](https://hal.github.io/dave/reports/playwright/) — built-in Playwright HTML report
- [Allure report](https://hal.github.io/dave/reports/allure/) — includes trend charts that track pass/fail rates across runs

Dependency updates are managed by [Dependabot](https://docs.github.com/en/code-security/dependabot), configured for weekly npm and GitHub Actions updates.
