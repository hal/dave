# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dave** is a Playwright + TypeScript UI test suite for [halOP](https://github.com/hal/halos), the WildFly management console. Each test file gets its own WildFly container (via testcontainers) for full isolation, while a shared halOP container is started once via global setup/teardown.

## Commands

```bash
pnpm test                              # Run all tests (headless, Chromium)
pnpm test:headed                       # Run with visible browser
pnpm test:ui                           # Playwright interactive UI mode
pnpm test:debug                        # Debug mode with inspector
pnpm report                            # Open last HTML report

pnpm test -- --grep "pattern"          # Run tests matching pattern
pnpm test -- src/tests/smoke/app-loads.spec.ts  # Run single spec file

pnpm lint                              # Run ESLint
pnpm lint:fix                          # Run ESLint with auto-fix
pnpm format                            # Format all files with Prettier
pnpm format:check                      # Check formatting without changing
```

## Prerequisites

- **Podman** or **Docker** — runs WildFly and halOP containers (auto-detected)
- Environment overrides in `.env` (see `.env.example`):
  - `WILDFLY_IMAGE` (default: `quay.io/wado/wado-sa:development`)
  - `HALOP_IMAGE` (default: `quay.io/halconsole/hal-op:test-suite`)
  - `HALOP_PORT` (default: `9090`)

## Architecture

### Test Lifecycle

```
global-setup.ts              →  starts halOP container
                                 writes state to /tmp/dave-state.json
                                 sets HALOP_URL env var

  test.beforeAll()           →  starts a WildFly container per test file
                                 (via testcontainers)
  src/fixtures/test.fixture.ts  →  creates page objects per test
  src/tests/**/*.spec.ts        →  test execution
  test.afterAll()            →  stops the WildFly container

global-teardown.ts           →  stops halOP container, cleans state file
```

### WildFly Container Isolation

Each test file that needs WildFly starts its own container in `test.beforeAll()`:

```typescript
test.beforeAll(async () => {
  wildfly = await startWildFlyContainer(containerNameFromSpec("smoke/dashboard"));
  setWildFly(wildfly);
});

test.afterAll(async () => {
  clearWildFly();
  await stopWildFlyContainer(wildfly);
});
```

Container names follow the pattern `dave_<path>` (e.g., `dave_smoke_dashboard`). Fixed ports: HTTP 18080, management 19990.

Tests that modify WildFly configuration can use `executeCliCommand()` to run JBoss CLI commands inside the container.

### Page Object Model

Tests use POM via custom Playwright fixtures defined in `src/fixtures/test.fixture.ts`:

- **`basePage`** — OUIA enablement, navigation with `?connect=` URL parameter, wait for `#hal-main-id`
- **`endpointPage`** — "Connect to WildFly" modal interactions
- **`dashboardPage`** — dashboard heading checks
- **`navigationPage`** — sidebar nav links (Dashboard, Deployments, Tasks, Configuration, Runtime, Management model)
- **`connectedPage`** — pre-connected basePage (runs `navigateWithConnect` + `waitForConsoleReady` before test)

Tests import the custom `test` and `expect` from `../fixtures/test.fixture` instead of `@playwright/test`.

### Utilities

- **`src/utils/wildfly-container.ts`** — testcontainers-based WildFly lifecycle (start, stop, CLI exec)
- **`src/utils/container-runtime.ts`** — auto-detects Podman or Docker for halOP container

## Key Conventions

- ES modules throughout (`"type": "module"`, NodeNext resolution)
- Tests run sequentially (workers: 1, fullyParallel: false)
- Each test file gets its own WildFly container for isolation
- Chromium-only project
- OUIA attributes used for element identification (PatternFly testing convention)
- halOP state shared between setup/teardown via `/tmp/dave-state.json`
- ESLint with TypeScript + Playwright rules, Prettier for formatting
