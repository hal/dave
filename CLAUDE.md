# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dave** is a Playwright + TypeScript UI test suite for [halOP](https://github.com/hal/foundation), the WildFly management console. Each test file gets its own WildFly container (via testcontainers) for full isolation, while a shared halOP container is started once via global setup/teardown.

## Commands

```bash
pnpm test                              # Run all tests (headless, all browsers)
pnpm test:headed                       # Run with visible browser
pnpm test:ui                           # Playwright interactive UI mode
pnpm test:debug                        # Debug mode with inspector
pnpm report                            # Open last Playwright HTML report
pnpm allure:generate                   # Generate Allure report from results
pnpm allure:serve                      # Serve Allure report with live reload
pnpm allure:open                       # Open a generated Allure report

pnpm test -- --grep "pattern"          # Run tests matching pattern
pnpm test -- src/tests/smoke/app-loads.spec.ts  # Run single spec file
pnpm test -- --project=chromium        # Run only in Chromium
pnpm test -- --project=firefox         # Run only in Firefox
pnpm test -- --project=webkit          # Run only in WebKit
pnpm test:smoke                        # Run only @smoke tests
pnpm test:dashboard                    # Run only @dashboard tests
pnpm test:navigation                   # Run only @navigation tests
pnpm test:model-browser                # Run only @model-browser tests
pnpm test -- --grep "@smoke|@dashboard"  # Combine groups (OR)

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
global-setup.ts              →  removes stale dave_* containers
                                 starts halOP container
                                 writes state to /tmp/dave-state.json
                                 sets HALOP_URL env var

  useWildFlyContainer()      →  starts a WildFly container per test file
                                 (via testcontainers, dynamic ports, healthcheck wait)
  src/fixtures/test.fixture.ts  →  creates page objects per test
  src/tests/**/*.spec.ts        →  test execution
  afterAll()                 →  stops the WildFly container

global-teardown.ts           →  stops halOP container, cleans state file
```

### WildFly Container Isolation

Each test file that needs WildFly calls `useWildFlyContainer()` at the top level, which handles `beforeAll`/`afterAll` lifecycle automatically:

```typescript
useWildFlyContainer(test, "smoke/dashboard");
```

Container names follow the pattern `dave_<path>_<project>` (e.g., `dave_smoke_dashboard_chromium`). Ports are dynamically allocated — use `wildfly.managementUrl` and `wildfly.httpUrl` instead of hardcoded ports.

The container's built-in HEALTHCHECK (`/health/ready` + `/management` fallback) is used as the wait strategy, ensuring the management interface is fully ready before tests run.

Tests that modify WildFly configuration can use `executeCliCommand()` to run JBoss CLI commands inside the container.

### Page Object Model

Tests use POM via custom Playwright fixtures defined in `src/fixtures/test.fixture.ts`:

- **`basePage`** — OUIA enablement via `addInitScript`, navigation with `?connect=` URL parameter, wait for `#hal-main-id`
- **`dashboardPage`** — dashboard heading checks
- **`navigationPage`** — sidebar nav links (Dashboard, Deployments, Tasks, Configuration, Runtime, Management model)

Tests import the custom `test` and `expect` from `../fixtures/test.fixture` instead of `@playwright/test`.

### Utilities

- **`src/utils/wildfly-container.ts`** — testcontainers-based WildFly lifecycle (start, stop, CLI exec)
- **`src/utils/container-runtime.ts`** — auto-detects Podman or Docker for halOP container

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`lint.yml`** — runs `pnpm format:check` and `pnpm lint` on push/PR to `main`
- **`test.yml`** — runs the full Playwright suite, uploads test results and JUnit report as artifacts, and deploys the Allure report (with trend history) to GitHub Pages on `main` pushes

Dependabot is configured in `.github/dependabot.yml` for weekly npm and GitHub Actions updates.

## Key Conventions

- ES modules throughout (`"type": "module"`, NodeNext resolution)
- Spec files run in parallel across workers (4 locally, 2 in CI); tests within a spec file are sequential (`fullyParallel: false`)
- Each test file gets its own WildFly container per browser project for isolation (dynamic ports, healthcheck-based readiness)
- Multi-browser: Chromium, Firefox, and WebKit
- OUIA attributes used for element identification (PatternFly testing convention)
- halOP state shared between setup/teardown via `/tmp/dave-state.json`
- ESLint with TypeScript + Playwright rules, Prettier for formatting
- Test grouping via Playwright tags — constants in `src/tags.ts`, applied via `tag` option on `test.describe()`. Tests can belong to multiple groups. Filter with `--grep @tag` or use group-specific pnpm scripts.
