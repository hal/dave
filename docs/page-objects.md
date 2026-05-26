# Creating Page Objects

When testing a new section of halOP, create a page object to encapsulate its locators and actions. This guide walks through the four steps.

## Step 1: Create the Page Object Class

Create `src/pages/runtime.page.ts`:

```typescript
import type { Locator, Page } from "@playwright/test";
import { MAIN_ID, NAV_RUNTIME } from "../selectors/ids.js";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

export class RuntimePage extends BasePage {
  readonly heading: Locator;
  readonly serverStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(`#${MAIN_ID}`).getByRole("heading", { name: "Runtime", level: 1 });
    this.serverStatus = page.getByText("RUNNING", { exact: true });
  }

  async navigate(): Promise<void> {
    await this.page.locator(ouiaSelector(NAV_RUNTIME)).click();
    await this.page.locator(`#${MAIN_ID}`).waitFor({ state: "visible" });
  }
}
```

**Guidelines:**

- Extend `BasePage` — it gives you the `page` property
- Define locators as `readonly` properties in the constructor
- Use OUIA selectors (`ouiaSelector()`) for halOP-specific elements
- Use Playwright's semantic locators (`getByRole`, `getByText`) for standard HTML elements
- Keep navigation in a `navigate()` method — the fixture calls it for you
- Don't store URLs or infrastructure details — that's the fixture's job

## Step 2: Register the Fixture

Edit `src/fixtures/pages.fixture.ts`:

```typescript
// Add the import
import { RuntimePage } from "../pages/runtime.page.js";

// Add to the interface
interface PageFixtures {
  // ...existing entries...
  runtimePage: RuntimePage;
}

// Add the fixture
export const test = testWithWildFly.extend<PageFixtures>({
  // ...existing entries...

  runtimePage: async ({ page, wildfly }, use) => {
    await openHalOp(page, wildfly.managementUrl);
    const runtimePage = new RuntimePage(page);
    await runtimePage.navigate();
    await use(runtimePage);
  },
});
```

The fixture pattern is always the same:

1. `openHalOp(page, wildfly.managementUrl)` — load halOP and connect to WildFly
2. Create the page object
3. Optionally call `navigate()` — if the page object has a specific section to navigate to
4. `await use(pageObject)` — hand it to the test

## Step 3: Write Tests

Create `src/tests/runtime/runtime.spec.ts`:

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "runtime/runtime" });

test.describe("Runtime", { tag: [Tag.SMOKE] }, () => {
  test("shows runtime heading", async ({ runtimePage }) => {
    await expect(runtimePage.heading).toBeVisible();
  });

  test("shows server status", async ({ runtimePage }) => {
    await expect(runtimePage.serverStatus).toBeVisible();
  });
});
```

## Step 4: Add a Tag (Optional)

If this is a new test group, add an entry to `src/tags.ts`:

```typescript
export const Tag = {
  // ...existing tags...
  RUNTIME: { value: "@runtime", description: "Runtime feature" },
} as const satisfies Record<string, TagDefinition>;
```

That's it — `pnpm test:tag runtime` works automatically. No other files need changes.
