# hal-record Skill Design

**Date:** 2026-05-26
**Status:** Proposed

## Purpose

`/hal-record` lets a developer record interactions in a live halOP browser session and produces a test proposal that feeds into `/hal-implement`. It bridges the gap between manual exploration and test scaffolding by capturing real user actions via Playwright codegen and transforming them into dave-convention proposals.

## Workflow

```text
/hal-record [feature-name]
    │
    ├── 1. Verify dev env is running (ports 19090 / 19990)
    ├── 2. Launch Playwright codegen with OUIA-aware config
    ├── 3. User interacts with halOP in the codegen browser
    ├── 4. User closes browser → recording saved to temp file
    ├── 5. Skill reads and parses the recording
    ├── 6. Maps selectors to OUIA constants from ids.ts
    ├── 7. Infers feature area, page structure, test cases
    ├── 8. Presents hal-implement-style proposal for approval
    ├── 9. User approves / adjusts the proposal
    └── 10. Offers to invoke /hal-implement
```

## Arguments

- **No argument** — launches codegen immediately. After the recording is parsed, the skill infers the feature area from navigation paths in the recording (e.g., clicking "Configuration" → feature is `configuration`). If the feature area cannot be inferred, the skill asks via `AskUserQuestion`.
- **Feature name** (e.g., `deployment`) — pre-tags the proposal with the feature area, skipping inference

## Prerequisites

- Dev environment running via `/hal-dev-env start`
- Playwright installed (`pnpm install`)

## Codegen Launch

The skill launches Playwright codegen with these flags:

```bash
npx playwright codegen \
  --target playwright-test \
  --test-id-attribute data-ouia-component-id \
  -o /tmp/dave-recording-<timestamp>.ts \
  "http://localhost:19090/?connect=http://localhost:19990"
```

Configuration rationale:

- `--target playwright-test` — generates `test()` / `expect()` syntax matching dave's test format
- `--test-id-attribute data-ouia-component-id` — makes codegen prefer OUIA selectors, producing `getByTestId('ouia-id')` calls
- `-o` with timestamp — avoids overwriting previous recordings
- URL includes `?connect=...` — halOP needs the WildFly management URL as a query parameter

Before launching, the skill prints instructions:

```text
Starting Playwright recorder...

Record your test scenario in the browser that opens.
Tips:
  - Click elements to record actions
  - Use the "Assert" toolbar button to add visibility/text checks
  - Close the browser when you're done recording

Waiting for recording to complete...
```

## Recording Parsing

After the codegen browser closes, the skill reads the output file. A typical recording looks like:

```typescript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:19090/?connect=http://localhost:19990');
  await page.getByTestId('nav-configuration').click();
  await page.getByTestId('cfg-subsystems-item').click();
  await page.getByRole('heading', { name: 'Logging' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Level' }).fill('DEBUG');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Parsing Strategy

Simple string/regex analysis (no AST parser):

1. **Extract actions** — match lines containing `page.goto`, `page.getByTestId`, `page.getByRole`, `page.getByText`, `page.locator`, and `expect()` calls
2. **Classify each action** — navigation, click, fill, or assertion
3. **Map `getByTestId('...')` to OUIA constants** — look up each test ID value in `src/selectors/ids.ts` and record the matching constant name (e.g., `getByTestId('nav-configuration')` maps to `NAV_CONFIGURATION`)
4. **Flag unmatched selectors** — any `getByTestId` value not found in `ids.ts` gets flagged as "OUIA ID exists in DOM but not in ids.ts — may need `pnpm sync:ouia`"
5. **Group actions into logical steps** — navigation + clicks before a form fill are setup; fills + saves are the action; assertions are verification
6. **Infer page object structure** — unique OUIA elements become locator properties, repeated action patterns become methods

## Proposal Output

The proposal follows the exact `/hal-implement` format from `references/conventions.md`:

````markdown
## Proposed Test: <feature> / <scenario>

**Source:** Recorded via /hal-record
**Category:** <inferred from navigation path>
**Tags:** [Tag.<TAG>.value]
**Spec path:** <category>/<name>

### Page Object

**Status:** NEW — `src/pages/<name>.page.ts` | EXTEND — `src/pages/<existing>.page.ts`

Locators:

- `<element>` → `ouiaSelector(ids.<CONSTANT>)` or `page.getByRole(...)`

Methods:

- `navigate()` → clicks nav link, waits for heading
- `<action>()` → describes what the method does

### Fixture Registration

Changes needed in `src/fixtures/pages.fixture.ts`:

- Import: `import { ExamplePage } from "../pages/example.page.js";`
- Interface: `examplePage: ExamplePage;`
- Fixture: `examplePage: async ({ page, wildfly }, use) => { ... }`

### Test Cases

1. **<derived from recorded actions>** — <description>
   - <step-by-step from recording>

### DMR Setup/Teardown

> Not detected from recording — review and add WildFly resource
> setup/teardown if the test requires specific server state.

### OUIA Coverage

- Matched: <OUIA IDs found in ids.ts>
- Unmatched: <OUIA IDs in recording but not in ids.ts>
- Non-OUIA selectors: <role/text selectors used>
````

### Approval & Handoff

After presenting the proposal:

> "Does this test proposal look good? You can:
>
> - **Approve** — I'll offer to run /hal-implement
> - **Adjust** — tell me what to change (especially DMR setup/teardown)
> - **Discard** — drop this recording"

On approval:

> "Shall I run /hal-implement to write the code now?"

If yes, the skill invokes `/hal-implement` with the approved proposal. If no, it prints the `/hal-implement` command for later use.

## Error Handling

| Error | Detection | Response |
| ----- | --------- | -------- |
| Dev env not running | `curl -sf localhost:19090` fails | "Run `/hal-dev-env start` first." |
| Empty recording | Output file is empty or boilerplate-only | "No actions recorded. Try again?" |
| Recording file missing | File not created at expected path | "Recording was not saved. Try again?" |
| No OUIA selectors | No `getByTestId` calls in recording | Warn: "No OUIA selectors found. Consider `pnpm sync:ouia` or `/hal-ouia`." |
| Codegen unavailable | `npx playwright codegen` fails | "Playwright codegen not available. Run `pnpm install` first." |

## Scope Boundaries

The skill does NOT:

- Write or modify source files (that is `/hal-implement`)
- Create or register page objects (that is `/hal-implement`)
- Start or stop containers (that is `/hal-dev-env`)
- Add OUIA IDs to halOP (that is `/hal-ouia`)
- Run tests (that is `/hal-implement` or manual)

## Skill Registration

Add to `.claude-plugin/plugin.json`:

```json
{
  "name": "hal-record",
  "path": "skills/hal-record/SKILL.md",
  "description": "Record browser interactions via Playwright codegen and scaffold test proposals"
}
```

## Tools

The skill uses:

- **Bash** — launch codegen, check dev env health, read recording file
- **Read** — read `src/selectors/ids.ts` for OUIA constant mapping, read existing page objects
- **Grep** — search for OUIA constants, check for existing coverage
- **AskUserQuestion** — proposal approval, feature name input
