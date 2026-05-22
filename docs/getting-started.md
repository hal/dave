# Getting Started

Named after astronaut Dave Bowman, the only one who could keep HAL in check. In the same spirit, **dave** keeps an eye on [halOP](https://github.com/hal/foundation) — the WildFly management console — making sure it behaves as expected.

dave is the UI test suite for halOP, built with [Playwright](https://playwright.dev/) and TypeScript. It automatically starts a [WildFly server](https://quay.io/repository/wado/wado-sa?tab=info) and [halOP container](https://quay.io/repository/halconsole/hal-op?tab=info), runs end-to-end tests against the management console, and tears everything down when finished.

## Prerequisites

- **Node.js** 22+
- **pnpm** (corepack-enabled, see `packageManager` in `package.json`)
- **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)** — runs WildFly and halOP containers (auto-detected)

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium firefox webkit

# Run all tests (headless)
pnpm test
```

If that works, you're ready. Head to [Running Tests](./running-tests.md) for all available commands, or jump straight to [Writing Tests](./writing-tests.md) to start contributing.
