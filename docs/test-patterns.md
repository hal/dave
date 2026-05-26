# Test Patterns

This page collects common patterns for structuring tests and performing actions. Use these as copy-paste starting points.

## Performing Actions

### Clicking

```typescript
await navigationPage.link("Dashboard").click();
await modelBrowserPage.findButton.click();
```

### Waiting After Actions

Some actions cause navigation or content changes. Wait for the result:

```typescript
// Wait for an element to appear
await navigationPage.navigateTo("Dashboard");
// navigateTo() already waits internally — see the page object source

// Explicit wait when needed
await modelBrowserPage.findButton.click();
await expect(modelBrowserPage.findResourceModal).toBeVisible();
```

## Test Structure Patterns

### Basic Test

```typescript
import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "category/feature" });

test.describe("Feature Name", { tag: [Tag.SMOKE] }, () => {
  test("does something specific", async ({ somePage }) => {
    await expect(somePage.someElement).toBeVisible();
  });
});
```

### Multiple Tests Sharing State

Tests within a `describe` block share the same WildFly container but get fresh page objects:

```typescript
test.describe("Dashboard", { tag: [Tag.SMOKE, Tag.DASHBOARD] }, () => {
  test("shows heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });

  test("shows overview section", async ({ dashboardPage }) => {
    // Fresh dashboardPage — independent from the test above
    await expect(dashboardPage.overviewSection).toBeVisible();
  });
});
```

### Data-Driven Tests

Loop over test data to generate multiple tests:

```typescript
import { NAV_ITEM_NAMES } from "../../pages/navigation.page.js";

for (const item of NAV_ITEM_NAMES) {
  test(`navigates to ${item}`, async ({ navigationPage }) => {
    await navigationPage.navigateTo(item);
    await expect(navigationPage.page.locator(`#${MAIN_ID}`)).toBeVisible();
  });
}
```

### Test Without Page Objects

For simple checks that don't need the full page object machinery:

```typescript
import { test, expect } from "../../fixtures/wildfly.fixture.js";

test("halOP serves the SPA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/hal/i);
});
```

Note the import from `wildfly.fixture.js` instead of `pages.fixture.js`.

## Common Patterns

### Checking Multiple Sections Exist

```typescript
test("shows host and JVM info", async ({ dashboardPage }) => {
  await expect(dashboardPage.hostSection).toBeVisible();
  await expect(dashboardPage.jvmSection).toBeVisible();
});
```

### Verifying Navigation Works

```typescript
test("navigates to Configuration", async ({ navigationPage }) => {
  await navigationPage.navigateTo("Configuration");
  await expect(navigationPage.page.locator(`#${MAIN_ID}`)).toBeVisible();
});
```

### Tree Navigation

```typescript
test("navigates to a specific subsystem", async ({ modelBrowserPage }) => {
  await modelBrowserPage.navigateToChild("subsystem", "datasources");
  await expect(modelBrowserPage.resourceHeading).toContainText("datasources");
});
```

### Tab Switching

```typescript
test("switches tabs", async ({ modelBrowserPage }) => {
  await modelBrowserPage.selectTab("Operations");
  await expect(modelBrowserPage.tabPanel("Operations")).toBeVisible();
});
```

### Checking a Modal Opens and Closes

```typescript
test("opens and closes find modal", async ({ modelBrowserPage }) => {
  await modelBrowserPage.findButton.click();
  await expect(modelBrowserPage.findResourceModal).toBeVisible();
  await modelBrowserPage.findResourceCancelButton.click();
  await expect(modelBrowserPage.findResourceModal).toBeHidden();
});
```
