# Test Grouping by Feature Area

## Problem

Tests need to be organized into feature-area groups so that specific subsets can be run independently. Tests should be able to belong to multiple groups. Reporting should reflect the grouping.

## Solution

Use Playwright's native `tag` feature (available since v1.42) with typed constants for tag names.

## Design

### 1. Tag Constants — `src/tags.ts`

A single source of truth for all tag values. Each tag is a `@`-prefixed string. The object is `as const` for type safety and autocomplete.

```typescript
export const Tag = {
  SMOKE: "@smoke",
  DASHBOARD: "@dashboard",
  NAVIGATION: "@navigation",
  MODEL_BROWSER: "@model-browser",
} as const;

export type TagValue = (typeof Tag)[keyof typeof Tag];
```

New feature areas are added here. The `TagValue` type can be used if custom utilities need to accept tags as parameters.

### 2. Test Tagging

Tags are applied via Playwright's `tag` option on `test.describe()`. All tests within a describe block inherit its tags. A test can belong to multiple groups via an array.

#### Tag Assignments

| Test File                             | Tags                          |
| ------------------------------------- | ----------------------------- |
| `smoke/app-loads.spec.ts`             | `Tag.SMOKE`                   |
| `smoke/dashboard.spec.ts`             | `Tag.SMOKE`, `Tag.DASHBOARD`  |
| `smoke/navigation.spec.ts`            | `Tag.SMOKE`, `Tag.NAVIGATION` |
| `model-browser/model-browser.spec.ts` | `Tag.MODEL_BROWSER`           |

#### Example

```typescript
import { Tag } from "../../tags.js";

test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
  test("shows dashboard heading", async ({ dashboardPage }) => {
    // ...
  });
});
```

Individual tests within a describe can add extra tags if needed:

```typescript
test.describe("Feature", { tag: Tag.SMOKE }, () => {
  test("basic check", async ({ page }) => {
    /* inherits @smoke */
  });

  test("detailed check", { tag: Tag.DASHBOARD }, async ({ page }) => {
    /* has both @smoke and @dashboard */
  });
});
```

### 3. pnpm Scripts

Group-specific scripts in `package.json`:

```json
{
  "test:smoke": "playwright test --grep @smoke",
  "test:dashboard": "playwright test --grep @dashboard",
  "test:navigation": "playwright test --grep @navigation",
  "test:model-browser": "playwright test --grep @model-browser"
}
```

The existing `test` script runs all tests regardless of tags. Ad-hoc combinations remain possible via CLI:

```bash
pnpm test -- --grep "@smoke|@dashboard"
pnpm test -- --grep-invert @slow
```

### 4. Reporting

No changes needed. Playwright's built-in HTML reporter:

- Displays tags as badges next to test names
- Supports filtering by tag in the filter bar (e.g., `@smoke`)
- Supports negative filtering (e.g., `!@smoke`)
- Shows tags in both list and detail views

Tags also appear in JUnit XML output for CI reporting.

### 5. Configuration

No changes to `playwright.config.ts`. Tag filtering stays at the CLI/script level, keeping the config clean and the default behavior (run all tests) unchanged.

### 6. Documentation

Update both `CLAUDE.md` and `README.md`:

- **`CLAUDE.md`**: Add tag constants location, how to add new tags, new pnpm scripts
- **`README.md`**: Add a "Test Groups" section documenting available groups, the group-specific scripts, and how to combine tags via CLI. Update the "Running Tests" table and "Project Structure" tree to include `src/tags.ts`.

## Files Changed

| File                                            | Change                                 |
| ----------------------------------------------- | -------------------------------------- |
| `src/tags.ts`                                   | New — tag constants                    |
| `src/tests/smoke/app-loads.spec.ts`             | Add tag import and `tag` option        |
| `src/tests/smoke/dashboard.spec.ts`             | Add tag import and `tag` option        |
| `src/tests/smoke/navigation.spec.ts`            | Add tag import and `tag` option        |
| `src/tests/model-browser/model-browser.spec.ts` | Add tag import and `tag` option        |
| `package.json`                                  | Add group-specific pnpm scripts        |
| `CLAUDE.md`                                     | Document tags and new scripts          |
| `README.md`                                     | Document tags, groups, and new scripts |

## Not in Scope

- No changes to `playwright.config.ts`
- No custom reporter plugins
- No project-based grouping (avoids combinatorial explosion with browsers)
- No title-embedded tags (keeps test titles clean)
