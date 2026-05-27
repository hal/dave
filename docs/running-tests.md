# Running Tests

## Commands

| Command                          | Description                           |
| -------------------------------- | ------------------------------------- |
| `pnpm test`                      | Run all tests headless (all browsers) |
| `pnpm test:headed`               | Run with a visible browser window     |
| `pnpm test:ui`                   | Playwright interactive UI mode        |
| `pnpm test:debug`                | Debug mode with Playwright inspector  |
| `pnpm test:tag <name> [name...]` | Run tests for one or more tags        |
| `pnpm test:tag`                  | List all available tags               |

## Filtering Tests

Filter tests by pattern, file, or browser:

```bash
pnpm test --grep "dashboard"
pnpm test src/tests/smoke/app-loads.spec.ts
pnpm test --project=chromium
pnpm test --project=firefox
pnpm test --project=webkit
```

## Test Groups

Tests are tagged by feature area using [Playwright's tag API](https://playwright.dev/docs/test-annotations#tag-tests). Tags are defined as typed constants in [`src/tags.ts`](https://github.com/hal/dave/blob/main/src/tags.ts) — each tag has a value and a description. Run `pnpm test:tag` with no arguments to list all available tags.

Tests can belong to multiple groups. Combine groups with OR logic:

```bash
pnpm test:tag smoke model-browser
pnpm test --grep "@smoke|@model-browser"
```

Exclude a group:

```bash
pnpm test --grep-invert @smoke
```

Tags are displayed in the [Playwright](https://hal.github.io/dave/reports/playwright/) and [Allure](https://hal.github.io/dave/reports/allure/) reports and can be used to filter results.

To add a new group, add a constant to `src/tags.ts` and apply it to test files via the `tag` option on `test.describe()`.

## Code Quality

Linting, formatting, and git hooks are covered in [Code Quality](./code-quality.md).

## Reports

After a test run:

```bash
pnpm report                # Open Playwright HTML report
pnpm allure:generate       # Generate Allure report from results
pnpm allure:serve          # Serve Allure report with live reload
pnpm allure:open           # Open a generated Allure report
```

The latest reports from `main` are published to GitHub Pages:

- [Playwright report](https://hal.github.io/dave/reports/playwright/)
- [Allure report](https://hal.github.io/dave/reports/allure/)
