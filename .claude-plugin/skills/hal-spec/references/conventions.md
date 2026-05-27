# Dave Convention Reference

Before writing any code, read these conventions. Every file created or modified MUST follow these patterns exactly. When in doubt, read the existing source files listed below — they are the canonical reference.

## Page Object Pattern

Page objects live in `src/pages/` and extend `BasePage` from `src/pages/base.page.ts`:

```typescript
import type { Locator, Page } from "@playwright/test";
import { MAIN_ID, NAV_EXAMPLE } from "../selectors/ids.js";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

export class ExamplePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(`#${MAIN_ID}`).getByRole("heading", { name: "Example", level: 1 });
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_EXAMPLE)).click();
    await this.heading.waitFor({ state: "visible" });
  }
}
```

**Rules:**

- Extend `BasePage` — never create standalone page classes
- Declare locators as `readonly` properties in the constructor
- Use OUIA selectors (`ouiaSelector(CONSTANT)`) for elements that have `data-ouia-component-id`
- Fall back to `page.getByRole()`, `page.getByText()`, or `page.locator()` only when no OUIA ID exists
- Import OUIA constants from `../selectors/ids.js`
- Include a `navigate()` method if the page needs explicit navigation
- Page objects are pure UI concerns — no WildFly URLs or infrastructure
- Reference: `src/pages/configuration.page.ts`, `src/pages/model-browser.page.ts`

## Fixture Registration Pattern

New page objects must be registered in `src/fixtures/pages.fixture.ts`. Three changes are needed:

1. **Import** the page class
2. **Add to the `PageFixtures` interface**
3. **Add the fixture definition** in the `test.extend<PageFixtures>()` call

```typescript
// 1. Import (add with existing imports)
import { ExamplePage } from "../pages/example.page.js";

// 2. Interface (add property)
interface PageFixtures {
  // ... existing entries ...
  examplePage: ExamplePage;
}

// 3. Fixture definition (add in test.extend block)
examplePage: async ({ page, wildfly }, use) => {
  await openHalOp(page, wildfly.managementUrl);
  const examplePage = new ExamplePage(page);
  await examplePage.navigate();  // only if the page has navigate()
  await use(examplePage);
},
```

**Rules:**

- Every fixture calls `openHalOp(page, wildfly.managementUrl)` first
- Call `navigate()` if the page object has one
- Use `await use(pageObject)` to hand the page to the test
- Reference: `src/fixtures/pages.fixture.ts` (read the entire file before modifying)

## Spec File Pattern

Spec files live in `src/tests/<category>/` and follow this exact structure:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "<category>/<name>" });

test.describe("<Feature Name>", { tag: [Tag.FEATURE.value] }, () => {
  test("<test description>", async ({ examplePage }) => {
    await expect(examplePage.heading).toBeVisible();
  });
});
```

**Rules:**

- Import `test` and `expect` from `../../fixtures/pages.fixture.js` (for tests using page objects)
- Import from `../../fixtures/wildfly.fixture.js` only for tests that don't need page objects
- Set `specPath` via `test.use()` — this determines the WildFly container name
- Wrap tests in `test.describe()` with appropriate tags
- Use `test.describe.serial()` for tests that must run in order (e.g., CRUD sequences)
- Destructure page objects and `wildfly` from the test function parameter
- Access `wildfly.managementUrl` for DMR operations
- Reference: `src/tests/model-browser/crud.spec.ts`, `src/tests/configuration/configuration.spec.ts`

## DMR Setup and Teardown

Tests that need specific WildFly state use DMR utilities from `src/utils/dmr.ts`:

```typescript
import { addResource, removeResource, readAttribute, resourceExists } from "../../utils/dmr.js";

// Setup: create a resource before the test
await addResource(wildfly.managementUrl, ["system-property", "test-prop"], { value: "test-value" });

// Verification: check WildFly state after UI action
const value = await readAttribute(wildfly.managementUrl, ["system-property", "test-prop"], "value");
expect(value).toBe("test-value");

// Teardown: clean up after the test
await removeResource(wildfly.managementUrl, ["system-property", "test-prop"]);

// Check existence
const exists = await resourceExists(wildfly.managementUrl, ["system-property", "test-prop"]);
```

**Rules:**

- `DmrAddress` is `readonly string[]` — alternating resource-type/resource-name pairs
- Always clean up resources created during tests
- Use `test.afterAll()` or `test.afterEach()` for cleanup, or place cleanup in the last serial test
- Verify WildFly state with DMR after UI operations to confirm the UI action had the expected effect
- Reference: `src/utils/dmr.ts`, `src/tests/model-browser/crud.spec.ts`

## Tag Pattern

Tags are defined in `src/tags.ts` as constants:

```typescript
export const Tag = {
  // ... existing tags ...
  NEW_FEATURE: { value: "@new-feature", description: "New feature tests" },
} as const satisfies Record<string, TagDefinition>;
```

**Rules:**

- Tag key: `UPPER_SNAKE_CASE`
- Tag value: `@kebab-case`
- Always include a description
- Reuse existing tags when they fit (check `src/tags.ts` before adding new ones)
- Reference: `src/tags.ts`

## Selector Strategy

Selector priority order:

1. **OUIA selectors** — `ouiaSelector(CONSTANT)` from `src/utils/ouia.ts` for elements with `data-ouia-component-id`
2. **Role selectors** — `page.getByRole("button", { name: "Save" })` for standard accessible elements
3. **Text selectors** — `page.getByText("some text")` for visible text
4. **CSS selectors** — `page.locator(".css-class")` only as a last resort

Check `src/selectors/ids.ts` for available OUIA ID constants before writing selectors.
