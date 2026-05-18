# dave

> *"Look Dave, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."*
> — HAL 9000, *2001: A Space Odyssey*

Named after astronaut Dave Bowman, the only one who could keep HAL in check. In the same spirit, **dave** keeps an eye on [halOP](https://github.com/hal/foundation) — the WildFly management console — making sure it behaves as expected.

UI test suite for [halOP](https://github.com/hal/halos), the WildFly management console. Built with [Playwright](https://playwright.dev/) and TypeScript.

dave automatically starts a WildFly server and halOP container, runs end-to-end tests against the management console, and tears everything down when finished.

## Prerequisites

- **Node.js** 22+
- **pnpm** (corepack-enabled, see `packageManager` in `package.json`)
- **wado** CLI — manages WildFly server instances (installed automatically as an optional dependency via [`@wildfly-admin-container/wado-{platform}`](https://www.npmjs.com/package/@wildfly-admin-container/wado-darwin-arm64))
- **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)** — runs the halOP container (auto-detected)

## Getting Started

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium

# Run all tests (headless)
pnpm test
```

## Running Tests

| Command | Description |
|---|---|
| `pnpm test` | Run all tests headless in Chromium |
| `pnpm test:headed` | Run with a visible browser window |
| `pnpm test:ui` | Playwright interactive UI mode |
| `pnpm test:debug` | Debug mode with Playwright inspector |
| `pnpm report` | Open the last HTML test report |

Filter tests by pattern or file:

```bash
pnpm test -- --grep "dashboard"
pnpm test -- src/tests/smoke/app-loads.spec.ts
```

## Configuration

Environment variables can be set in a `.env` file (see [`.env.example`](.env.example)):

| Variable | Default | Description |
|---|---|---|
| `WILDFLY_VERSION` | `dev` | WildFly version passed to `wado start` |
| `HALOP_IMAGE` | `quay.io/halconsole/hal-op:test-suite` | halOP container image |
| `HALOP_PORT` | `9090` | Host port mapped to the halOP container |

## How It Works

### Test Lifecycle

```
global-setup.ts       starts WildFly (via wado) + halOP container
                      writes state to /tmp/dave-state.json
                      exports HALOP_URL and WILDFLY_URL

  tests/*.spec.ts     Playwright tests run against halOP + WildFly

global-teardown.ts    stops halOP container + WildFly
                      cleans up state file
```

Tests run **sequentially** with a single worker against one shared WildFly instance.

### Page Object Model

Custom Playwright fixtures in [`src/fixtures/test.fixture.ts`](src/fixtures/test.fixture.ts) provide page objects to each test:

| Fixture | Purpose |
|---|---|
| `basePage` | OUIA enablement, navigation with `?connect=` parameter |
| `endpointPage` | "Connect to WildFly" modal interactions |
| `dashboardPage` | Dashboard heading assertions |
| `navigationPage` | Sidebar navigation (Dashboard, Deployments, Configuration, Runtime, etc.) |
| `connectedPage` | Pre-connected page (navigates and waits for console ready) |

Tests import `test` and `expect` from `../fixtures/test.fixture` instead of `@playwright/test`.

### Element Identification

Tests use [OUIA](https://ouia.readthedocs.io/) attributes for element selection, following PatternFly's testing conventions.

## Project Structure

```
dave/
  global-setup.ts              # Start WildFly + halOP before tests
  global-teardown.ts           # Stop WildFly + halOP after tests
  playwright.config.ts         # Playwright configuration
  src/
    fixtures/
      test.fixture.ts          # Custom fixtures with page objects
    pages/
      base.page.ts             # Base page object
      dashboard.page.ts        # Dashboard page object
      endpoint.page.ts         # Endpoint connection page object
      navigation.page.ts       # Navigation page object
    tests/
      smoke/                   # Smoke tests
        app-loads.spec.ts
        dashboard.spec.ts
        endpoint-connection.spec.ts
        navigation.spec.ts
    utils/
      container-runtime.ts     # Auto-detect Podman or Docker
      wado.ts                  # wado CLI wrapper
```

## Related Projects

| Project | Description |
|---|---|
| [halOP](https://github.com/hal/halos) | WildFly management console (the application under test) |
| [wado](https://www.npmjs.com/package/@wildfly-admin-container/wado-darwin-arm64) | CLI tool for managing WildFly server instances (platform-specific npm packages) |
| [WildFly](https://www.wildfly.org/) | The application server managed by halOP |

## Container Images

| Image | Description |
|---|---|
| [`quay.io/halconsole/hal-op:test-suite`](https://quay.io/repository/halconsole/hal-op?tab=tags) | halOP image used by the test suite |
| [`quay.io/halconsole/hal-op:development`](https://quay.io/repository/halconsole/hal-op?tab=tags) | halOP development image |
| [`quay.io/halconsole/hal-op:latest`](https://quay.io/repository/halconsole/hal-op?tab=tags) | Latest halOP release |
