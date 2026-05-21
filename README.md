# dave

> _"Look Dave, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."_
> — HAL 9000, _2001: A Space Odyssey_

Named after astronaut Dave Bowman, the only one who could keep HAL in check. In the same spirit, **dave** keeps an eye on [halOP](https://github.com/hal/foundation) — the WildFly management console — making sure it behaves as expected.

UI test suite for [halOP](https://github.com/hal/foundation), the WildFly management console. Built with [Playwright](https://playwright.dev/) and TypeScript.

dave automatically starts a WildFly server and halOP container, runs end-to-end tests against the management console, and tears everything down when finished.

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

## Code Quality

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `pnpm lint`         | Run ESLint                        |
| `pnpm lint:fix`     | Run ESLint with auto-fix          |
| `pnpm format`       | Format all files with Prettier    |
| `pnpm format:check` | Check formatting without changing |

ESLint is configured with TypeScript and [Playwright-specific](https://github.com/playwright-community/eslint-plugin-playwright) rules. Prettier handles all formatting. See `eslint.config.js` and `.prettierrc` for details.

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
| `pnpm test:dashboard`     | Run only `@dashboard` tests           |
| `pnpm test:navigation`    | Run only `@navigation` tests          |
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
| `@dashboard`     | Dashboard feature     | `dashboard`                            |
| `@navigation`    | Navigation feature    | `navigation`                           |
| `@model-browser` | Model browser feature | `model-browser`                        |

Tests can belong to multiple groups. Combine groups with OR logic:

```bash
pnpm test -- --grep "@smoke|@model-browser"
```

Exclude a group:

```bash
pnpm test -- --grep-invert @smoke
```

Tags are displayed as badges in the [HTML test report](https://hal.github.io/dave/reports/allure/) and can be used to filter results.

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
  src/fixtures/test.fixture.ts  creates page objects per test
  src/tests/**/*.spec.ts        test execution
  worker teardown             stops the WildFly container

global-teardown.ts            stops halOP container, cleans state file
```

Spec files run **in parallel** across multiple workers (4 locally, 2 in CI). Tests within a spec file are sequential. Each test file gets its own isolated WildFly container per browser project via a worker-scoped Playwright fixture backed by [testcontainers](https://node.testcontainers.org/). Tests run in Chromium, Firefox, and WebKit.

### WildFly Container Fixture

WildFly containers are managed by a **worker-scoped Playwright fixture** defined in [`src/fixtures/test.fixture.ts`](src/fixtures/test.fixture.ts). Spec files that need a WildFly container import `testWithWildFly` and declare their spec path:

```typescript
import { testWithWildFly as test, expect } from "../../fixtures/test.fixture.js";

test.use({ specPath: "smoke/dashboard" });
```

The fixture starts a container before any test in the worker runs and stops it after the last test finishes. Container names follow the pattern `dave_<path>_<project>` (e.g., `dave_smoke_dashboard_chromium`). Ports are dynamically allocated.

Spec files that don't need WildFly (e.g., `app-loads.spec.ts`) import `test` and `expect` directly from the fixture module.

### Page Object Model

Custom Playwright fixtures in [`src/fixtures/test.fixture.ts`](src/fixtures/test.fixture.ts) provide page objects to each test:

| Fixture            | Purpose                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `basePage`         | OUIA enablement, navigation with `?connect=` parameter, wait for `<main>` |
| `dashboardPage`    | Dashboard heading assertions                                              |
| `modelBrowserPage` | Model browser tree and resource assertions                                |
| `navigationPage`   | Sidebar navigation (Dashboard, Deployments, Configuration, Runtime, etc.) |

Tests import `testWithWildFly as test` and `expect` from `../fixtures/test.fixture` instead of `@playwright/test`.

### Element Identification

Tests use [OUIA](https://ouia.readthedocs.io/) attributes for element selection, following [PatternFly's](https://www.patternfly.org/developer-resources/open-ui-automation) testing conventions. The OUIA component IDs defined in [halOP](https://github.com/hal/foundation) are collected and published as the [`@halconsole/ouia`](https://www.npmjs.com/package/@halconsole/ouia) npm package, which dave consumes to reference UI elements by stable, well-known identifiers.

## Project Structure

```
dave/
  global-setup.ts              # Start halOP before tests
  global-teardown.ts           # Stop halOP after tests
  playwright.config.ts         # Playwright configuration
  src/
    fixtures/
      test.fixture.ts          # Worker-scoped WildFly fixture + page objects
    pages/
      base.page.ts             # Base page object
      dashboard.page.ts        # Dashboard page object
      model-browser.page.ts    # Model browser page object
      navigation.page.ts       # Navigation page object
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

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow  | Trigger                                                    | What it does                                                                                           |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Lint**  | Push / PR to `main`                                        | Checks formatting (Prettier) and linting (ESLint)                                                      |
| **Smoke** | Push / PR to `main`                                        | Runs `@smoke` tests in Chromium only — fast pass/fail gate, no reports                                 |
| **Test**  | Push to `main` (path-filtered), daily at 05:00 UTC, manual | Full suite across Chromium, Firefox, and WebKit; uploads artifacts and deploys reports to GitHub Pages |

The **Test** workflow only triggers on pushes to `main` that change test or config files (`src/**`, `playwright.config.ts`, `global-setup.ts`, `global-teardown.ts`, `package.json`, `pnpm-lock.yaml`). A daily schedule catches regressions from upstream WildFly or halOP image changes. It can also be triggered manually via `workflow_dispatch`.

The latest test reports from `main` are published to **[GitHub Pages](https://hal.github.io/dave/)**:

- [Allure report](https://hal.github.io/dave/reports/allure/) — includes trend charts that track pass/fail rates across runs
- [Playwright report](https://hal.github.io/dave/reports/playwright/) — built-in Playwright HTML report

Dependency updates are managed by [Dependabot](https://docs.github.com/en/code-security/dependabot), configured for weekly npm and GitHub Actions updates.
