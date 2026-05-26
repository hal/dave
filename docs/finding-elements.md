# Finding Elements

This reference covers the different strategies for locating elements in tests — from page objects (preferred) to raw Playwright locators (last resort).

## Using Page Objects (Preferred)

Page objects expose locators as properties and methods:

```typescript
// Properties — defined in the constructor
await expect(dashboardPage.heading).toBeVisible();
await expect(modelBrowserPage.tree).toBeVisible();

// Methods — for dynamic elements
await expect(modelBrowserPage.treeItem("subsystem")).toBeVisible();
await expect(navigationPage.link("Dashboard")).toBeVisible();
```

For guidance on creating new page objects, see [Page Objects](page-objects.md).

## Using OUIA IDs

halOP uses [OUIA](https://ouia.readthedocs.io/) attributes (`data-ouia-component-id`) for stable element identification. The IDs are defined in `src/selectors/ids.ts` (generated from halOP's Java source).

```typescript
import { MAIN_ID, NAV_DASHBOARD } from "../selectors/ids.js";
import { ouiaSelector } from "../utils/ouia.js";

// ouiaSelector("nav-dashboard") → '[data-ouia-component-id="nav-dashboard"]'
const navLink = page.locator(ouiaSelector(NAV_DASHBOARD));
```

## When OUIA IDs Are Missing

If the element you need to target doesn't have a `data-ouia-component-id` attribute and no constant exists in `src/selectors/ids.ts`, the ID needs to be added upstream in the `hal/foundation` repository. If you use Claude Code, the `/hal-ouia` skill automates this — it adds constants to `OuiaIds.java`, chains `.ouiaId()` calls in the Java source, creates a PR, and syncs the new IDs back to dave. See [Skills](skills.md) for details.

In the meantime, use Playwright's built-in locators (see below) as a temporary measure.

## Using Playwright's Built-in Locators

When OUIA IDs aren't available, use Playwright's semantic locators (in order of preference):

```typescript
// By role (best — matches how users perceive the page)
page.getByRole("button", { name: "Submit" });
page.getByRole("heading", { name: "Dashboard", level: 1 });
page.getByRole("tab", { name: "Attributes" });
page.getByRole("treeitem", { name: "subsystem", exact: true });

// By text
page.getByText("WildFly", { exact: true });
page.getByText(/running/i); // regex for case-insensitive

// By label (form elements)
page.getByLabel("Filter by name");

// By test ID (if available)
page.getByTestId("my-element");

// By CSS selector (last resort)
page.locator("#hal-root-container");
page.locator('[data-ouia-component-type="PF6/Component/Card"]');
```

## Scoping Locators

Narrow your search to a specific section to avoid matching elements elsewhere on the page:

```typescript
// Scope to the main content area
const main = page.locator(`#${MAIN_ID}`);
const heading = main.getByRole("heading", { name: "Overview", level: 2 });

// Scope to a specific tab panel
const panel = modelBrowserPage.tabPanel("Operations");
await expect(panel.getByText("add", { exact: true })).toBeVisible();

// Chain .filter() for card-like elements
const card = page
  .locator('[data-ouia-component-type="PF6/Component/Card"]')
  .filter({ has: page.getByRole("heading", { name: "Data source", level: 2 }) });
```
