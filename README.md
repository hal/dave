# dave

> _"Look Dave, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."_
> — HAL 9000, _2001: A Space Odyssey_

Named after astronaut Dave Bowman, the only one who could keep HAL in check. In the same spirit, **dave** keeps an eye on [halOP](https://github.com/hal/foundation) — the WildFly management console — making sure it behaves as expected.

dave is the UI test suite for [halOP](https://github.com/hal/foundation), built with [Playwright](https://playwright.dev/) and TypeScript. It automatically starts a [WildFly server](https://quay.io/repository/wado/wado-sa?tab=info) and [halOP container](https://quay.io/repository/halconsole/hal-op?tab=info), runs end-to-end tests against the management console, and tears everything down when finished.

## Prerequisites

- **Node.js** 22+
- **pnpm** (corepack-enabled, see `packageManager` in `package.json`)
- **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)** — runs WildFly and halOP containers (auto-detected)

## Quick Start

```bash
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm test
```

## Documentation

Full documentation is available at **[hal.github.io/dave](https://hal.github.io/dave/)** — including architecture details, fixture system docs, a contributor guide for writing tests, CI/CD setup, and [Claude Code skills](https://hal.github.io/dave/skills) for AI-assisted test development.

## Reports

- [Playwright report](https://hal.github.io/dave/reports/playwright/)
- [Allure report](https://hal.github.io/dave/reports/allure/)
