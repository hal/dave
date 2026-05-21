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
pnpm test:configuration                # Run only @configuration tests
pnpm test:tasks                        # Run only @tasks tests
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

  worker-scoped fixture      →  starts a WildFly container per worker
                                 (via testcontainers, dynamic ports, healthcheck wait)
  src/fixtures/wildfly.fixture.ts →  WildFly container lifecycle (worker-scoped)
  src/fixtures/pages.fixture.ts  →  enables OUIA, navigates to halOP, creates page objects
  src/tests/**/*.spec.ts        →  test execution
  worker teardown            →  stops the WildFly container

global-teardown.ts           →  stops halOP container, cleans state file
```

### WildFly Container Fixture

WildFly containers are managed by a **worker-scoped Playwright fixture** in `src/fixtures/wildfly.fixture.ts`. Spec files that need WildFly and page objects import `test` from `pages.fixture.ts` and declare their spec path via `test.use()`:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";

test.use({ specPath: "smoke/dashboard" });
```

The fixture starts a container before any test in the worker runs and stops it after the last test finishes. Spec files that don't need WildFly (e.g., `app-loads.spec.ts`) import `test` and `expect` from `wildfly.fixture.ts`.

Container names follow the pattern `dave_<path>_<project>` (e.g., `dave_smoke_dashboard_chromium`). Ports are dynamically allocated — use `wildfly.managementUrl` and `wildfly.httpUrl` instead of hardcoded ports.

The container's built-in HEALTHCHECK is used as the wait strategy (`Wait.forHealthCheck()`), ensuring the management interface is fully ready before tests run.

Tests that modify WildFly configuration can use `executeCliCommand()` to run JBoss CLI commands inside the container.

### Page Object Model

Tests use POM via custom Playwright fixtures defined in `src/fixtures/pages.fixture.ts`. Page objects are pure UI concerns (locators and actions) — they don't know about WildFly URLs or infrastructure. The fixture layer handles navigation via `openHalOp(page, managementUrl)` before handing each page object to the test, so tests receive ready-to-use pages:

- **`basePage`** — base page with shared `page` accessor
- **`configurationPage`** — configuration finder tree (Subsystems, Interfaces, Socket Bindings, Paths, System Properties)
- **`dashboardPage`** — dashboard sections (overview, host, JVM, memory, log, links)
- **`modelBrowserPage`** — model browser tree, toolbar, tabs, and resource assertions
- **`navigationPage`** — sidebar nav links (Dashboard, Deployments, Tasks, Configuration, Runtime, Management model)
- **`tasksPage`** — task cards (Data source, Logging, Management SSL, Reverse proxy, SSL, Statistics)

Tests import `test` and `expect` from `../fixtures/pages.fixture` instead of `@playwright/test`.

### Adding New Pages and Tests

**New page object**: Create `src/pages/foo.page.ts` extending `BasePage`, then register it in `src/fixtures/pages.fixture.ts` (import, interface entry, fixture). No other files need changes — OUIA and WildFly lifecycle are automatic.

**New test**: Create a spec file under `src/tests/`, import `test` and `expect` from `pages.fixture.ts` (with WildFly) or `wildfly.fixture.ts` (without), set `specPath` via `test.use()`.

**New test group**: Add a constant to `src/tags.ts`, optionally add a pnpm script.

### Utilities

- **`src/utils/wildfly-container.ts`** — testcontainers-based WildFly lifecycle (start, stop, container naming, CLI exec)
- **`src/utils/container-runtime.ts`** — auto-detects Podman or Docker for halOP container
- **`src/utils/ouia.ts`** — builds `[data-ouia-component-id="..."]` CSS selectors from OUIA IDs
- **`src/utils/configure-testcontainers.ts`** — auto-configures testcontainers for Podman (socket detection, Ryuk disabled)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`lint.yml`** — runs `pnpm format:check` and `pnpm lint` on push/PR to `main`
- **`smoke.yml`** — fast pass/fail gate on push/PR to `main`; runs only `@smoke` tests in Chromium; no reports or artifacts
- **`test.yml`** — full Playwright suite (all tests, all browsers); triggers on pushes to `main` when test/config files change, daily at 05:00 UTC, or manually via `workflow_dispatch`; uploads test results and JUnit report as artifacts; deploys Allure and Playwright reports to GitHub Pages

Dependabot is configured in `.github/dependabot.yml` for weekly npm and GitHub Actions updates.

## Key Conventions

- ES modules throughout (`"type": "module"`, NodeNext resolution)
- Spec files run in parallel across workers (4 locally, 2 in CI); tests within a spec file are sequential (`fullyParallel: false`)
- Each test file gets its own WildFly container per browser project via a worker-scoped fixture (dynamic ports, HEALTHCHECK-based readiness)
- Multi-browser: Chromium, Firefox, and WebKit
- OUIA attributes used for element identification (PatternFly testing convention)
- halOP state shared between setup/teardown via `/tmp/dave-state.json`
- ESLint with TypeScript + Playwright rules, Prettier for formatting
- Test grouping via Playwright tags — constants in `src/tags.ts`, applied via `tag` option on `test.describe()`. Tests can belong to multiple groups. Filter with `--grep @tag` or use group-specific pnpm scripts.
