# CI/CD

## Workflows

GitHub Actions workflows in [`.github/workflows/`](https://github.com/hal/dave/tree/main/.github/workflows):

| Workflow  | Trigger                                                    | What it does                                                                                           |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Lint**  | Push / PR to `main`                                        | Checks formatting (Prettier) and linting (ESLint)                                                      |
| **Sync**  | Push / PR to `main`                                        | Detects OUIA ID drift — fails if `ids.ts` doesn't match upstream `Ids.java`                            |
| **Smoke** | Push / PR to `main`                                        | Runs `@smoke` tests in Chromium only — fast pass/fail gate, no reports                                 |
| **Test**  | Push to `main` (path-filtered), daily at 05:00 UTC, manual | Full suite across Chromium, Firefox, and WebKit; uploads artifacts and deploys reports to GitHub Pages |
| **Docs**  | Push to `main` (docs changed), manual                      | Builds VitePress docs and deploys to GitHub Pages                                                      |

The **Test** workflow only triggers on pushes to `main` that change test or config files (`src/**`, `playwright.config.ts`, `global-setup.ts`, `global-teardown.ts`, `package.json`, `pnpm-lock.yaml`). A daily schedule catches regressions from upstream WildFly or halOP image changes. It can also be triggered manually via `workflow_dispatch`.

## Reports

The latest test reports from `main` are published to GitHub Pages:

- [Playwright report](https://hal.github.io/dave/reports/playwright/) — built-in Playwright HTML report
- [Allure report](https://hal.github.io/dave/reports/allure/) — includes trend charts that track pass/fail rates across runs

## GitHub Pages Deployment

GitHub Pages deploys the entire site as **one atomic artifact** — there is no way to deploy just a subdirectory. This means both the Docs and Test workflows must assemble the complete site (documentation + reports) to avoid overwriting each other:

- The **Docs** workflow builds the VitePress site and fetches existing reports from the live Pages site
- The **Test** workflow builds fresh reports and also builds the VitePress docs

Either workflow can deploy independently without losing the other's content.

## Dependabot

Dependency updates are managed by [Dependabot](https://docs.github.com/en/code-security/dependabot), configured for weekly npm and GitHub Actions updates. See [`.github/dependabot.yml`](https://github.com/hal/dave/blob/main/.github/dependabot.yml).
