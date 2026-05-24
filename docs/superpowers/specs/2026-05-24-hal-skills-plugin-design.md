# HAL Skills Plugin — Design Spec

**Date:** 2026-05-24
**Status:** Draft
**Author:** Harald Pehl + Claude

## Overview

A Claude Code plugin bundling four skills that streamline the development loop between [halOP](https://github.com/hal/foundation) (the WildFly management console) and [dave](https://github.com/hal/dave) (its Playwright test suite). The goal is to keep the gap between new halOP features and their test coverage as small as possible.

## Problem

halOP is under active development. New features land regularly, each needing:

1. Test coverage in dave (spec files, page objects, fixtures)
2. OUIA IDs and stable selectors in halOP for reliable test targeting
3. Synced OUIA constants and container images between the two repos

Today this is a manual, multi-step process across two codebases. These skills automate and guide each step.

## Architecture

### Plugin Structure

The plugin lives in dave's repo and bundles four skills:

| Skill           | Slash command    | Purpose                                        |
| --------------- | ---------------- | ---------------------------------------------- |
| `hal-dev-env`   | `/hal-dev-env`   | Start/manage local WildFly + halOP environment |
| `hal-explore`   | `/hal-explore`   | Discover test gaps between halOP and dave      |
| `hal-implement` | `/hal-implement` | Implement new tests interactively              |
| `hal-ouia`      | `/hal-ouia`      | Update halOP OUIA IDs for testability          |

### Dependency Graph

```
hal-dev-env  (foundation — no dependencies)
     ↑
     ├── hal-explore    (read-only, produces test gap report)
     ├── hal-implement  (writes tests, may flag OUIA gaps)
     └── hal-ouia       (cross-repo, modifies halOP + syncs dave)
```

All three main skills check if the dev environment is running and reference `hal-dev-env` as a prerequisite.

### Plugin File Layout

```
.claude/plugins/hal/
├── plugin.json              # Plugin manifest
└── skills/
    ├── hal-dev-env.md       # Dev environment skill
    ├── hal-explore.md       # Test gap exploration skill
    ├── hal-implement.md     # Test implementation skill
    └── hal-ouia.md          # OUIA update skill
```

## Skill 1: `hal-dev-env` — Local Development Environment

### Purpose

Start and manage a local WildFly + halOP environment for interactive exploration and testing. Idempotent — skips startup if containers are already running.

### Configuration

On first use, the skill resolves the halOP foundation repo path:

1. Check `../foundation` relative to dave's root (convention)
2. If not found, prompt the user and save to `.claude/hal-config.json`

Config file (`.claude/hal-config.json`):

```json
{
  "foundationDir": "../foundation",
  "devPorts": {
    "halop": 19090,
    "wildfly": 19990
  }
}
```

### Port Strategy

Dev environment uses `19xxx` ports to avoid collisions:

| Service            | Dev port | Dave test port           | WildFly default |
| ------------------ | -------- | ------------------------ | --------------- |
| halOP console      | 19090    | 9090                     | —               |
| WildFly management | 19990    | dynamic (testcontainers) | 9990            |

### Startup Sequence

1. **Idempotent check** — look for running containers named `dave_dev_wildfly` and `dave_dev_halop`. If both are running, report URLs and skip.
2. **Start WildFly** via wado using `standalone-no-auth` configuration (image: `quay.io/wado/wado-sa:development`). Container name: `dave_dev_wildfly`. Expose management on port 19990.
3. **Start halOP** container (image: `quay.io/halconsole/hal-op:test-suite`). Container name: `dave_dev_halop`. Expose on port 19090.
4. **Wait for readiness** — health-check both containers.
5. **Open browser** at `http://localhost:19090/?connect=http://localhost:19990`.

### Teardown

Stop both containers when invoked with a stop intent or when the user is done.

### Container Runtime

Use the same auto-detection logic as dave (`src/utils/container-runtime.ts`) — Podman preferred, Docker as fallback.

## Skill 2: `hal-explore` — Discover Test Gaps

### Purpose

Find halOP features that lack test coverage in dave, then interactively explore them in the browser to propose concrete test scenarios.

### Phase 1: Code-Level Gap Analysis

1. **Inventory halOP features** — scan `op/console/src/main/java/org/jboss/hal/op/` to identify distinct features/pages (dashboard, configuration, deployment, runtime, model browser, tasks, etc.). The `ui/` module provides reusable components but the testable surface is defined by the `op/console` module.

2. **Inventory dave tests** — scan `src/tests/` for spec files and `src/pages/` for page objects. Map which halOP features are covered.

3. **Cross-reference** — produce a gap report:
   - Features with no corresponding test file or page object
   - Features with thin coverage (page object exists but only smoke-level tests)
   - Features with tests but missing OUIA IDs (fragile selectors)

4. **Present the gap report** — sorted by priority (core CRUD and navigation flows first, edge cases later).

### Phase 2: Browser-Driven Exploration

5. **For each gap** (or a user-selected one), use Chrome DevTools to:
   - Navigate to the relevant halOP page
   - Take snapshots of the UI structure
   - Inspect OUIA IDs and available selectors
   - Observe interactive flows (click sequences, form fills, state changes)

6. **Propose test scenarios** — for each explored feature:
   - Test name and description
   - Required page object methods
   - Key assertions
   - DMR setup/teardown needed
   - Whether existing OUIA IDs are sufficient or `hal-ouia` is needed first

7. **Iterate** — user approves, adjusts, or skips each proposal before moving to the next gap.

### Output

A prioritized list of proposed test cases. The skill does not write any code — it produces the test plan that `hal-implement` consumes.

## Skill 3: `hal-implement` — Implement Tests Interactively

### Purpose

Write new test cases and page objects in dave, guided by the halOP source and the running console. Works in an interactive propose-approve-implement loop.

### Workflow

1. **Input** — user specifies what to test:
   - A gap from `hal-explore`'s output (e.g., "deployment page")
   - A specific feature (e.g., "adding a system property via configuration")
   - A halOP source path (e.g., `op/console/.../runtime/`)

2. **Reconnaissance** — the skill:
   - Reads the relevant halOP source in `op/console/` to understand the feature
   - Uses Chrome DevTools to navigate to the feature in the running console
   - Inspects available OUIA IDs and DOM structure
   - Identifies what selectors and page object methods are needed

3. **Propose a test case** — presents:
   - Test name, description, and tags
   - Page object: new or extend existing, with proposed methods/locators
   - Test steps and assertions
   - DMR setup/teardown needed (e.g., `addResource` before test, `removeResource` after)
   - Whether OUIA IDs are sufficient or `hal-ouia` is needed first

4. **User approves or adjusts** the proposal.

5. **Implement** — the skill:
   - Creates or updates the page object in `src/pages/`
   - Creates the spec file in `src/tests/` with proper fixture imports, `test.use()`, tags
   - Registers new page objects in `src/fixtures/pages.fixture.ts` if needed
   - Adds new tags to `src/tags.ts` if needed
   - Follows all dave conventions from CLAUDE.md

6. **Verify** — runs `pnpm test -- <spec-file> --project=chromium` to check the test passes.

7. **Loop** — proposes the next test case for the same feature, or moves to the next. User controls when to stop.

### Key Constraints

- Follow dave's existing patterns exactly — read `pages.fixture.ts`, existing page objects, and existing tests to match conventions
- DMR setup is the norm — always consider what WildFly state needs to exist before the test and what needs cleaning up after
- Use OUIA selectors via `src/utils/ouia.ts` wherever possible; fall back to role/text selectors only when OUIA IDs don't exist

## Skill 4: `hal-ouia` — Update halOP for Testability

### Purpose

Bridge OUIA ID and selector gaps between halOP and dave. Modifies the halOP foundation codebase to ensure UI elements are testable, then syncs the changes back to dave.

### Workflow

1. **Identify gaps** — the skill determines what's missing by:
   - Reading dave test code and page objects to see what selectors are used or needed
   - Using Chrome DevTools on the running console to inspect the actual DOM
   - Comparing against `Ids.java` constants and OUIA attributes in the halOP source (`op/console/` and `ui/` modules)

2. **Propose changes** — for each gap:
   - Which halOP Java file needs modification
   - What OUIA ID constant to add to `Ids.java` (if needed)
   - Where to apply the `data-ouia-component-id` attribute in the component code
   - Preview of how the selector will be used in dave

3. **User approves** the proposed changes.

4. **Implement in halOP** — the skill:
   - Adds constants to `Ids.java`
   - Adds OUIA attributes to the relevant Java UI components
   - Creates a feature branch (e.g., `ouia/add-deployment-ids`)
   - Commits and pushes to the halOP repo
   - Opens a PR via `gh pr create`

5. **Wait for CI** — after the user merges the PR:
   - Watches the `test-suite.yml` GitHub Actions workflow via `gh run watch` or `gh api`
   - Once the workflow succeeds (image pushed to quay.io), proceeds to sync

6. **Sync dave** — runs:
   - `pnpm sync:ouia` to regenerate `src/selectors/ids.ts` from updated `Ids.java`
   - `pnpm sync:image` to pull the new `hal-op:test-suite` container image

7. **Verify** — restarts the dev environment with the new image and confirms the new selectors are present in the DOM via Chrome DevTools.

### Cross-Repo Details

- **halOP branch strategy:** Feature branch + PR (e.g., `ouia/add-deployment-ids`). Never pushes directly to main.
- **CI pipeline:** The `test-suite.yml` workflow triggers automatically after the halOP build succeeds on main. It builds and pushes the `hal-op:test-suite` multi-arch container image to quay.io.
- **OUIA conventions:** The skill must understand how `Ids.java` constants are structured (static final strings, builder methods) and how `data-ouia-component-id` attributes are applied in halOP's PatternFly/J2CL components.

## Shared Infrastructure

### halOP Foundation Path Resolution

All skills that need access to the halOP codebase:

1. Check `.claude/hal-config.json` for a saved path
2. Check `../foundation` relative to dave's root (convention)
3. If neither works, prompt the user and save to `.claude/hal-config.json`

### Dev Environment Prerequisite

Each main skill checks if the dev environment is running before proceeding:

1. Look for containers `dave_dev_wildfly` and `dave_dev_halop`
2. If not running, tell the user to run `/hal-dev-env` first and stop. Do not auto-invoke — the user should control when containers start.

### Chrome DevTools

Skills 2, 3, and 4 use Chrome DevTools MCP to interact with the running halOP console. This requires the browser to be open at the dev environment URL.

## Implementation Phases

Build in dependency order, ship each skill as it's completed:

| Phase | Skill           | Scope                              | Dependencies                                          |
| ----- | --------------- | ---------------------------------- | ----------------------------------------------------- |
| 1     | `hal-dev-env`   | Smallest, clearest requirements    | None                                                  |
| 2     | `hal-explore`   | Read-only, validates dev env works | `hal-dev-env`                                         |
| 3     | `hal-implement` | Most complex (code generation)     | `hal-dev-env`, benefits from `hal-explore`            |
| 4     | `hal-ouia`      | Most cross-cutting (two repos, CI) | `hal-dev-env`, informed by `hal-implement` experience |

Each phase gets its own implementation plan via the writing-plans skill.

## Plugin Distribution

The plugin source lives inside dave's repo. Developers install it locally. Marketplace publishing is a future option once the skills are battle-tested.

## Open Questions

None — all questions resolved during brainstorming.
