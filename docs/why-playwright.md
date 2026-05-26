# Why Playwright?

## Background

The HAL management console has two generations:

- [**HAL console**](https://github.com/hal/console) — the current management console for WildFly, with [berg](https://github.com/hal/berg) as its Cypress-based test suite.
- [**halOP**](https://github.com/hal/foundation) — the next-generation management console, built from scratch with a modern stack.

halOP is not an incremental update — it is a ground-up rewrite. That made it the right moment to re-evaluate the test tooling rather than carry over accumulated technical debt. dave is the result: a new test suite built with [Playwright](https://playwright.dev/) and TypeScript, designed around the specific needs of halOP.

## Why Not Keep Cypress?

berg served its purpose well, but several Cypress limitations became friction points as the test suite grew:

### Browser Coverage

Cypress has strong support for Chrome-family browsers, but Firefox support is [experimental](https://docs.cypress.io/app/references/launching-browsers#Firefox-browsers) and WebKit support is not available. halOP targets Chromium, Firefox, and WebKit equally — testing all three with the same confidence level is a hard requirement.

### Architecture Constraints

Cypress runs test code _inside_ the browser. This design gives it fast access to the DOM, but it also imposes fundamental limitations:

- No native multi-tab or multi-window testing
- Cross-origin restrictions require `cy.origin()` workarounds
- The command queue model (`cy.get().click().should()`) differs from standard async/await, making test code harder to reason about and debug

### Test Isolation

Cypress shares browser state between tests more aggressively, making it harder to achieve clean per-spec isolation. dave's architecture requires each spec file to get its own WildFly container — a model that maps naturally to Playwright's worker-based parallelism but fights against Cypress's execution model.

### External Dependencies

berg requires Java and Maven at build time to download JDBC drivers and compile deployment artifacts. This raises the barrier to entry for contributors who only want to write UI tests. dave is a pure Node.js/TypeScript project — `pnpm install` and a container runtime are all you need.

## What Playwright Brings

### True Multi-Browser Support

Playwright ships with Chromium, Firefox, and WebKit engines. All three are first-class citizens — same API, same assertions, same test code. Tests run identically across browsers without conditional logic or workarounds.

### Worker-Based Parallelism

Playwright's worker model assigns each spec file to an OS-level worker process. This maps directly to dave's container-per-spec architecture: one worker starts one WildFly container, runs all tests in that spec, and tears it down. No shared state, no cross-contamination.

### Modern Async/Await

Playwright uses standard TypeScript `async`/`await` throughout. There is no command queue, no implicit chaining, and no special syntax to learn. Test code reads like regular TypeScript:

```typescript
await page.getByRole("button", { name: "Save" }).click();
await expect(page.getByText("Configuration saved")).toBeVisible();
```

### Auto-Waiting

Playwright automatically waits for elements to be actionable before interacting with them. Combined with web-first assertions that retry until a condition is met, this eliminates most explicit waits and reduces test flakiness.

### Fixture System

Playwright's [fixture model](https://playwright.dev/docs/test-fixtures) is a natural fit for managing test infrastructure. dave uses it to layer container lifecycle, OUIA enablement, navigation, and page objects — each concern in its own fixture, composed cleanly without inheritance hierarchies.

### Built-In Tooling

Playwright includes a trace viewer for debugging failed tests, a code generator for bootstrapping new tests, a UI mode for interactive development, and an HTML reporter. dave adds [Allure](https://allurereport.org/) reporting on top for richer CI reports.

## What Stayed the Same

Not everything changed. Several proven patterns from berg carried over to dave:

- **TypeScript** — both suites are written in TypeScript. This was a deliberate choice: using the same language makes it possible to reuse code, patterns, and domain knowledge from berg.
- **testcontainers** — both suites use [testcontainers](https://node.testcontainers.org/) to start and manage WildFly containers. The testcontainers integration was a good pattern worth keeping.
- **Container-based isolation** — the principle of giving each test scope its own WildFly instance, with dynamic ports and health-check-based readiness, carries over from berg.

## Comparison

| Aspect | berg (Cypress) | dave (Playwright) |
| --- | --- | --- |
| **Framework** | [Cypress](https://www.cypress.io/) | [Playwright](https://playwright.dev/) |
| **Browsers** | Chrome-family (Firefox experimental, no WebKit) | Chromium, Firefox, WebKit (all first-class) |
| **Execution model** | In-browser, command queue | Out-of-process, async/await |
| **Parallelism** | Process-level, manual orchestration | Native workers, one per spec file |
| **Test isolation** | Shared browser state | Worker-scoped fixtures, container per spec |
| **Multi-tab/window** | Not supported | Supported natively |
| **Cross-origin** | Requires `cy.origin()` | Handled transparently |
| **Auto-waiting** | Partial (command retry) | Built-in for all actions and assertions |
| **Dependencies** | Node.js, Java, Maven | Node.js only |
| **Reporting** | Mochawesome | Playwright HTML + Allure |
| **Debugging** | Cypress DevTools | Trace viewer, UI mode, codegen |
| **Container management** | testcontainers | testcontainers |
| **Language** | TypeScript | TypeScript |
