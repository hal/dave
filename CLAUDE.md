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

pnpm test --grep "pattern"              # Run tests matching pattern
pnpm test src/tests/smoke/app-loads.spec.ts  # Run single spec file
pnpm test --project=chromium            # Run only in Chromium
pnpm test --project=firefox             # Run only in Firefox
pnpm test --project=webkit              # Run only in WebKit
pnpm test:tag <name> [name...]          # Run tests for one or more tags (tags defined in src/tags.ts)
pnpm test:tag smoke -- --project=chromium  # Run tag with extra Playwright options
pnpm test:tag                          # List all available tags

pnpm sync:ouia                         # Regenerate OUIA IDs from upstream OuiaIds.java
pnpm sync:identifiers                  # Regenerate identifiers from upstream Identifiers.java
pnpm sync:image                        # Pull latest halOP container image
pnpm sync:status                       # Check sync status (IDs, identifiers, CI build, image)
pnpm sync:ci                           # Check OUIA ID and identifier drift (CI mode, fails if out of sync)
pnpm sync:help                         # Show sync command help

pnpm lint                              # Run ESLint
pnpm lint:fix                          # Run ESLint with auto-fix
pnpm lint:md                           # Lint markdown files
pnpm lint:md:fix                       # Lint markdown with auto-fix
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

```text
global-setup.ts              →  removes stale dave_* containers
                                 starts halOP container (via testcontainers)
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

Container names follow the pattern `dave_<path>_<project>` (e.g., `dave_smoke_dashboard_chromium`). halOP is an SPA — the browser makes management API calls directly using `wildfly.managementUrl` (`localhost:<mapped-port>`). Use `wildfly.httpUrl` for deployment-related host-side access.

The container's built-in HEALTHCHECK is used as the wait strategy (`Wait.forHealthCheck()`), ensuring the management interface is fully ready before tests run.

Tests that need to verify or modify WildFly configuration use the DMR utilities in `src/utils/dmr.ts`. The `dmr()` function posts JSON operations to the management API via HTTP. Higher-level helpers include `readAttribute()`, `writeAttribute()`, `addResource()`, `removeResource()`, and `resourceExists()`. All take `wildfly.managementUrl` and a `DmrAddress` (e.g., `["system-property", "foo"]`).

### Page Object Model

Tests use POM via custom Playwright fixtures defined in `src/fixtures/pages.fixture.ts`. Page objects are pure UI concerns (locators and actions) — they don't know about WildFly URLs or infrastructure. The fixture layer handles navigation via `openHalOp(page, managementUrl)` before handing each page object to the test, so tests receive ready-to-use pages. Check `src/fixtures/pages.fixture.ts` for the current list of available page fixtures.

Tests import `test` and `expect` from `../fixtures/pages.fixture` instead of `@playwright/test`.

### Adding New Pages and Tests

**New page object**: Create `src/pages/foo.page.ts` extending `BasePage`, then register it in `src/fixtures/pages.fixture.ts` (import, interface entry, fixture). No other files need changes — OUIA and WildFly lifecycle are automatic.

**New test**: Create a spec file under `src/tests/`, import `test` and `expect` from `pages.fixture.ts` (with WildFly) or `wildfly.fixture.ts` (without), set `specPath` via `test.use()`.

**New test group**: Add a constant to `src/tags.ts`, optionally add a pnpm script.

### Element Identification Sync

halOP uses two identification mechanisms, both synced from hal/foundation and drift-checked by CI:

- **OUIA IDs** — synced from `OuiaIds.java` via `pnpm sync:ouia` into `src/selectors/ids.ts`. Use `ouiaSelector()` from `src/utils/ouia.ts`. Targets buttons, badges, modals, form items, toolbars.
- **Identifiers** — synced from `Identifiers.java` via `pnpm sync:identifiers` into `src/selectors/identifiers.ts`. Use `identifierSelector()` from `src/utils/identifier.ts`. Targets finder columns/items, breadcrumbs, tabs, tree view items.

OUIA IDs target elements without a built-in identity (buttons, badges, modals, form items, toolbars). Identifiers target PatternFly components that implement `HasIdentifier` (finder columns, finder items, breadcrumbs, tabs, tree view items). Both generated files are committed to git so the project works without running sync first.

### Utilities

- **`src/utils/wildfly-container.ts`** — testcontainers-based WildFly lifecycle (start, stop, container naming)
- **`src/utils/dmr.ts`** — HTTP-based DMR operations against the WildFly management API (read/write attributes, add/remove resources, existence checks)
- **`src/utils/container-runtime.ts`** — auto-detects Podman or Docker for halOP container
- **`src/utils/ouia.ts`** — builds `[data-ouia-component-id="..."]` CSS selectors from OUIA IDs
- **`src/utils/identifier.ts`** — builds `[data-identifier="..."]` CSS selectors from identifiers
- **`src/selectors/ids.ts`** — generated OUIA ID constants (run `pnpm sync:ouia` to regenerate)
- **`src/selectors/identifiers.ts`** — generated identifier constants (run `pnpm sync:identifiers` to regenerate)
- **`src/utils/configure-testcontainers.ts`** — auto-configures testcontainers for Podman (socket detection, Ryuk disabled)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`lint.yml`** — runs `pnpm format:check` and `pnpm lint` on push/PR to `main`
- **`sync.yml`** — detects OUIA ID and identifier drift on push/PR to `main`; regenerates `ids.ts` and `identifiers.ts` from upstream and fails if either differs from the committed file
- **`smoke.yml`** — fast pass/fail gate on push/PR to `main`; runs only `@smoke` tests in Chromium; no reports or artifacts
- **`test.yml`** — full Playwright suite (all tests, all browsers); triggers automatically after Smoke succeeds on `main`, daily at 05:00 UTC, or manually via `workflow_dispatch`; uploads test results and JUnit report as artifacts; deploys Allure and Playwright reports to GitHub Pages

Dependabot is configured in `.github/dependabot.yml` for weekly npm and GitHub Actions updates.

## Key Conventions

- ES modules throughout (`"type": "module"`, NodeNext resolution)
- Spec files run in parallel across workers (4 locally, 2 in CI); tests within a spec file are sequential (`fullyParallel: false`)
- Each test file gets its own WildFly container per browser project via a worker-scoped fixture (dynamic ports, HEALTHCHECK-based readiness)
- Multi-browser: Chromium, Firefox, and WebKit
- OUIA attributes used for element identification (PatternFly testing convention)
- halOP state shared between setup/teardown via `/tmp/dave-state.json`
- ESLint with TypeScript + Playwright rules, Prettier for formatting
- Test grouping via Playwright tags — constants in `src/tags.ts`, applied via `tag` option on `test.describe()`. Tests can belong to multiple groups. Filter with `pnpm test:tag` or `--grep @tag`.

## Skills and Agents

Project-level skills in `.claude/skills/` provide AI-assisted test development:

- **`/hal-dev-env`** — starts and manages a local WildFly + halOP dev environment (containers on ports 19090/19990)
- **`/hal-explore`** — analyzes test coverage gaps by cross-referencing halOP source with existing dave tests and page objects
- **`/hal-spec`** — writes new tests interactively via a propose-approve-implement loop, following dave conventions
- **`/hal-ouia`** — adds missing OUIA IDs to halOP, creates PRs on `hal/foundation`, and syncs generated constants back to dave
- **`/hal-record`** — records browser interactions via Playwright codegen and scaffolds test proposals for `/hal-spec`

A **playwright-reviewer** agent in `.claude/agents/` reviews test specs for dave convention violations.

Skills require the `hal/foundation` repository path, configured in `.claude/hal-config.json` or auto-detected at `../foundation`. See `docs/skills.md` for full documentation.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
