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
pnpm exec playwright install chromium

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

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm test`        | Run all tests headless in Chromium   |
| `pnpm test:headed` | Run with a visible browser window    |
| `pnpm test:ui`     | Playwright interactive UI mode       |
| `pnpm test:debug`  | Debug mode with Playwright inspector |
| `pnpm report`      | Open the last HTML test report       |

Filter tests by pattern or file:

```bash
pnpm test -- --grep "dashboard"
pnpm test -- src/tests/smoke/app-loads.spec.ts
```

## Configuration

Environment variables can be set in a `.env` file (see [`.env.example`](.env.example)):

| Variable        | Default                                | Description                             |
| --------------- | -------------------------------------- | --------------------------------------- |
| `WILDFLY_IMAGE` | `quay.io/wado/wado-sa:development`     | WildFly container image                 |
| `HALOP_IMAGE`   | `quay.io/halconsole/hal-op:test-suite` | halOP container image                   |
| `HALOP_PORT`    | `9090`                                 | Host port mapped to the halOP container |

## How It Works

### Test Lifecycle

```
global-setup.ts              starts halOP container
                              writes state to /tmp/dave-state.json
                              sets HALOP_URL env var

  test.beforeAll()            starts a WildFly container per test file
                              (via testcontainers)
  src/fixtures/test.fixture.ts  creates page objects per test
  src/tests/**/*.spec.ts        test execution
  test.afterAll()             stops the WildFly container

global-teardown.ts            stops halOP container, cleans state file
```

Tests run **sequentially** with a single worker. Each test file gets its own isolated WildFly container via [testcontainers](https://node.testcontainers.org/).

### Page Object Model

Custom Playwright fixtures in [`src/fixtures/test.fixture.ts`](src/fixtures/test.fixture.ts) provide page objects to each test:

| Fixture          | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `basePage`       | OUIA enablement, navigation with `?connect=` parameter                    |
| `dashboardPage`  | Dashboard heading assertions                                              |
| `navigationPage` | Sidebar navigation (Dashboard, Deployments, Configuration, Runtime, etc.) |

Tests import `test` and `expect` from `../fixtures/test.fixture` instead of `@playwright/test`.

### Element Identification

Tests use [OUIA](https://ouia.readthedocs.io/) attributes for element selection, following PatternFly's testing conventions.

## Project Structure

```
dave/
  global-setup.ts              # Start halOP before tests
  global-teardown.ts           # Stop halOP after tests
  playwright.config.ts         # Playwright configuration
  src/
    fixtures/
      test.fixture.ts          # Custom fixtures with page objects
      wildfly.fixture.ts       # WildFly container lifecycle per test file
    pages/
      base.page.ts             # Base page object
      dashboard.page.ts        # Dashboard page object
      navigation.page.ts       # Navigation page object
    tests/
      smoke/                   # Smoke tests
        app-loads.spec.ts
        dashboard.spec.ts
        navigation.spec.ts
    utils/
      configure-testcontainers.ts  # Testcontainers config
      container-runtime.ts         # Auto-detect Podman or Docker
      wildfly-container.ts         # WildFly container lifecycle
```

## CI/CD

GitHub Actions runs lint and tests on every push to `main` and on pull requests:

- **Lint** — checks formatting (Prettier) and linting (ESLint)
- **Test** — installs Chromium, runs the full Playwright suite, and uploads test results as artifacts

The latest Playwright HTML report from `main` is published to **GitHub Pages**: https://hal.github.io/dave/

Dependency updates are managed by [Dependabot](https://docs.github.com/en/code-security/dependabot), configured for weekly npm and GitHub Actions updates.

## Related Projects

| Project                                            | Description                                             |
| -------------------------------------------------- | ------------------------------------------------------- |
| [halOP](https://github.com/hal/foundation)              | WildFly management console (the application under test) |
| [WildFly](https://www.wildfly.org/)                | The application server managed by halOP                 |
| [testcontainers](https://node.testcontainers.org/) | Container management for integration tests              |

## Container Images

| Image                                                                                           | Description                        |
| ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`quay.io/halconsole/hal-op:test-suite`](https://quay.io/repository/halconsole/hal-op?tab=tags) | halOP image used by the test suite |
| [`quay.io/wado/wado-sa:development`](https://quay.io/repository/wado/wado-sa?tab=tags)          | WildFly image used for test containers |
