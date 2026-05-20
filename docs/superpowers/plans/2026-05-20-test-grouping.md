# Test Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add feature-area test grouping using Playwright's native `tag` API so tests can be filtered by group at the CLI and in reports.

**Architecture:** A shared `src/tags.ts` file defines typed tag constants. Each test file's `test.describe()` gets a `tag` option referencing those constants. New pnpm scripts wrap `playwright test --grep @tag` for convenience.

**Tech Stack:** Playwright `tag` option (v1.42+), TypeScript `as const` objects

---

## File Map

| File                                            | Action | Responsibility                                               |
| ----------------------------------------------- | ------ | ------------------------------------------------------------ |
| `src/tags.ts`                                   | Create | Single source of truth for tag constants                     |
| `src/tests/smoke/app-loads.spec.ts`             | Modify | Add `@smoke` tag                                             |
| `src/tests/smoke/dashboard.spec.ts`             | Modify | Add `@smoke` + `@dashboard` tags                             |
| `src/tests/smoke/navigation.spec.ts`            | Modify | Add `@smoke` + `@navigation` tags                            |
| `src/tests/model-browser/model-browser.spec.ts` | Modify | Add `@model-browser` tag                                     |
| `package.json`                                  | Modify | Add group-specific pnpm scripts                              |
| `CLAUDE.md`                                     | Modify | Document tags, new scripts                                   |
| `README.md`                                     | Modify | Document tags, groups, new scripts, update project structure |

---

### Task 1: Create tag constants file

**Files:**

- Create: `src/tags.ts`

- [ ] **Step 1: Create `src/tags.ts`**

```typescript
export const Tag = {
  SMOKE: "@smoke",
  DASHBOARD: "@dashboard",
  NAVIGATION: "@navigation",
  MODEL_BROWSER: "@model-browser",
} as const;

export type TagValue = (typeof Tag)[keyof typeof Tag];
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit src/tags.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/tags.ts
git commit -m "feat: add tag constants for test grouping"
```

---

### Task 2: Tag smoke/app-loads.spec.ts

**Files:**

- Modify: `src/tests/smoke/app-loads.spec.ts`

- [ ] **Step 1: Add tag import and tag option**

The file currently looks like:

```typescript
import { test, expect } from "../../fixtures/test.fixture.js";

test.describe("App loads", () => {
```

Change it to:

```typescript
import { test, expect } from "../../fixtures/test.fixture.js";
import { Tag } from "../../tags.js";

test.describe("App loads", { tag: Tag.SMOKE }, () => {
```

Only two changes: add the import line after the existing import, and add `{ tag: Tag.SMOKE }` as the second argument to `test.describe`.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/tests/smoke/app-loads.spec.ts
git commit -m "feat: tag app-loads tests with @smoke"
```

---

### Task 3: Tag smoke/dashboard.spec.ts

**Files:**

- Modify: `src/tests/smoke/dashboard.spec.ts`

- [ ] **Step 1: Add tag import and tag option**

The file currently looks like:

```typescript
import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";

useWildFlyContainer(test, "smoke/dashboard");

test.describe("Dashboard", () => {
```

Change it to:

```typescript
import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { Tag } from "../../tags.js";

useWildFlyContainer(test, "smoke/dashboard");

test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
```

Two changes: add the import line, and add `{ tag: [Tag.SMOKE, Tag.DASHBOARD] }` as the second argument to `test.describe`.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/tests/smoke/dashboard.spec.ts
git commit -m "feat: tag dashboard tests with @smoke and @dashboard"
```

---

### Task 4: Tag smoke/navigation.spec.ts

**Files:**

- Modify: `src/tests/smoke/navigation.spec.ts`

- [ ] **Step 1: Add tag import and tag option**

The file currently looks like:

```typescript
import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { NAV_ITEMS } from "../../pages/navigation.page.js";
import { MAIN_CONTENT_ID } from "../../pages/base.page.js";

useWildFlyContainer(test, "smoke/navigation");

test.describe("Navigation", () => {
```

Change it to:

```typescript
import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { NAV_ITEMS } from "../../pages/navigation.page.js";
import { MAIN_CONTENT_ID } from "../../pages/base.page.js";
import { Tag } from "../../tags.js";

useWildFlyContainer(test, "smoke/navigation");

test.describe("Navigation", { tag: [Tag.SMOKE, Tag.NAVIGATION] }, () => {
```

Two changes: add the import line after the existing imports, and add `{ tag: [Tag.SMOKE, Tag.NAVIGATION] }` as the second argument to `test.describe`.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/tests/smoke/navigation.spec.ts
git commit -m "feat: tag navigation tests with @smoke and @navigation"
```

---

### Task 5: Tag model-browser/model-browser.spec.ts

**Files:**

- Modify: `src/tests/model-browser/model-browser.spec.ts`

- [ ] **Step 1: Add tag import and tag option**

The file currently looks like:

```typescript
import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { TOP_LEVEL_RESOURCES } from "../../pages/model-browser.page.js";

useWildFlyContainer(test, "model-browser/model-browser");

test.describe("Model Browser", () => {
```

Change it to:

```typescript
import { test, expect, useWildFlyContainer } from "../../fixtures/test.fixture.js";
import { TOP_LEVEL_RESOURCES } from "../../pages/model-browser.page.js";
import { Tag } from "../../tags.js";

useWildFlyContainer(test, "model-browser/model-browser");

test.describe("Model Browser", { tag: Tag.MODEL_BROWSER }, () => {
```

Two changes: add the import line after the existing imports, and add `{ tag: Tag.MODEL_BROWSER }` as the second argument to `test.describe`.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/tests/model-browser/model-browser.spec.ts
git commit -m "feat: tag model-browser tests with @model-browser"
```

---

### Task 6: Add pnpm scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add group-specific scripts**

In the `"scripts"` section of `package.json`, add these four entries after the existing `"test:debug"` line:

```json
"test:smoke": "playwright test --grep @smoke",
"test:dashboard": "playwright test --grep @dashboard",
"test:navigation": "playwright test --grep @navigation",
"test:model-browser": "playwright test --grep @model-browser",
```

The full `"scripts"` section should look like:

```json
"scripts": {
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:ui": "playwright test --ui",
  "test:debug": "playwright test --debug",
  "test:smoke": "playwright test --grep @smoke",
  "test:dashboard": "playwright test --grep @dashboard",
  "test:navigation": "playwright test --grep @navigation",
  "test:model-browser": "playwright test --grep @model-browser",
  "report": "playwright show-report",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
},
```

- [ ] **Step 2: Verify scripts are recognized**

Run: `pnpm run --help-workspace 2>&1 | head -5` (just verify no JSON parse errors)
Run: `pnpm test:smoke --help 2>&1 | head -3` (verify the script resolves)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add pnpm scripts for running tests by group"
```

---

### Task 7: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Add tag documentation to CLAUDE.md**

In the `## Commands` section, add the group-specific scripts to the existing code block, after the `pnpm test -- --project=webkit` line:

```bash
pnpm test:smoke                        # Run only @smoke tests
pnpm test:dashboard                    # Run only @dashboard tests
pnpm test:navigation                   # Run only @navigation tests
pnpm test:model-browser                # Run only @model-browser tests
pnpm test -- --grep "@smoke|@dashboard"  # Combine groups (OR)
```

In the `## Key Conventions` section, add a new bullet at the end:

```markdown
- Test grouping via Playwright tags — constants in `src/tags.ts`, applied via `tag` option on `test.describe()`. Tests can belong to multiple groups. Filter with `--grep @tag` or use group-specific pnpm scripts.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document test grouping in CLAUDE.md"
```

---

### Task 8: Update README.md

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add group-specific scripts to the "Running Tests" table**

Add these rows to the table at line 43-50:

```markdown
| `pnpm test:smoke` | Run only `@smoke` tests |
| `pnpm test:dashboard` | Run only `@dashboard` tests |
| `pnpm test:navigation` | Run only `@navigation` tests |
| `pnpm test:model-browser` | Run only `@model-browser` tests |
```

- [ ] **Step 2: Add a "Test Groups" section**

Add a new section after the "Filter tests by pattern, file, or browser" code block (after line 60) and before the "## Configuration" section:

````markdown
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
````

Exclude a group:

```bash
pnpm test -- --grep-invert @smoke
```

Tags are displayed as badges in the [HTML test report](https://hal.github.io/dave/) and can be used to filter results.

To add a new group, add a constant to `src/tags.ts` and apply it to test files via the `tag` option on `test.describe()`.

```

- [ ] **Step 3: Add `src/tags.ts` to the "Project Structure" tree**

In the project structure tree (line 111-132), add `tags.ts` under the `src/` directory, after the `fixtures/` section:

```

src/
fixtures/
test.fixture.ts # Custom fixtures with page objects
wildfly.fixture.ts # WildFly container lifecycle per test file
pages/
base.page.ts # Base page object
dashboard.page.ts # Dashboard page object
model-browser.page.ts # Model browser page object
navigation.page.ts # Navigation page object
tags.ts # Tag constants for test grouping
tests/

````

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document test groups and tags in README"
````

---

### Task 9: Verify end-to-end

- [ ] **Step 1: Verify lint passes**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 2: Verify formatting**

Run: `pnpm format:check`
Expected: No formatting issues (run `pnpm format` first if needed)

- [ ] **Step 3: Dry-run grep filtering**

Run: `pnpm test:smoke --list`
Expected: Lists only tests from `app-loads`, `dashboard`, and `navigation` spec files

Run: `pnpm test:model-browser --list`
Expected: Lists only tests from `model-browser` spec file

Run: `pnpm test -- --grep @dashboard --list`
Expected: Lists only tests from `dashboard` spec file

- [ ] **Step 4: Commit any formatting fixes**

If `pnpm format` changed anything:

```bash
git add -A
git commit -m "chore: fix formatting"
```
