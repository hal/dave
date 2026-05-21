# Missing OUIA IDs in halOP

Selectors in dave that still use `getByRole` or CSS because halOP doesn't assign OUIA IDs to these elements yet. Tracked here so OUIA IDs can be added in the [halOP codebase](https://github.com/hal/foundation).

## Resolved: Stale console.js

~~The compiled `console.js` used non-standard OUIA attribute names. Fixed in PF Java v0.8.3 (commit `affa7902`). The `test-suite` image was rebuilt successfully and now renders correct `data-ouia-component-id` / `data-ouia-component-type` attributes.~~

**Status:** Resolved. OUIA selectors are working and used in `navigation.page.ts` and `dashboard.page.ts`.

## Resolved: pageMain Does Not Set OUIA ID

~~`pageMain(Ids.MAIN_ID)` in `Skeleton.java:111` sets the HTML `id` attribute (`id="hal-main-id"`), **not** `data-ouia-component-id`. The `<main>` element does not participate in OUIA.~~

**Status:** Skipped. The test suite uses the `id` attribute on the `<main>` element, which is acceptable.

## Resolved: Model Browser

### Tree

| Selector                          | OUIA ID                       | Status   |
| --------------------------------- | ----------------------------- | -------- |
| `getByRole("tree")`               | `hal-op-model-browser-tree`   | Resolved |
| `getByRole("treeitem", { name })` | dynamic via tree view item ID | Skipped  |

Tree items get their IDs from `ModelBrowserNode` identifiers — no additional OUIA ID needed.

### Tabs

| Selector                                     | OUIA ID                                 | Status   |
| -------------------------------------------- | --------------------------------------- | -------- |
| tabs container                               | `hal-op-model-browser-tabs`             | Resolved |
| `getByRole("tab", { name: "Data" })`         | `hal-op-model-browser-tab-data`         | Resolved |
| `getByRole("tab", { name: "Attributes" })`   | `hal-op-model-browser-tab-attributes`   | Resolved |
| `getByRole("tab", { name: "Operations" })`   | `hal-op-model-browser-tab-operations`   | Resolved |
| `getByRole("tab", { name: "Capabilities" })` | `hal-op-model-browser-tab-capabilities` | Resolved |

### Controls

| Selector                                                  | OUIA ID                                          | Status   |
| --------------------------------------------------------- | ------------------------------------------------ | -------- |
| `getByRole("switch", { name: "Show global operations" })` | `hal-op-model-browser-global-ops-switch`         | Resolved |
| operations filter textbox                                 | `hal-op-model-browser-operations-filter`         | Resolved |
| attributes filter textbox                                 | `hal-op-model-browser-attributes-filter`         | Resolved |

### Resource Detail

| Selector            | OUIA ID                                 | Status   |
| ------------------- | --------------------------------------- | -------- |
| resource heading    | `hal-op-model-browser-resource-heading` | Resolved |
| breadcrumb nav      | `hal-op-model-browser-breadcrumb`       | Resolved |

### Table Headers

| Selector                                      | Page Object                     | Suggested OUIA ID               |
| --------------------------------------------- | ------------------------------- | ------------------------------- |
| `getByRole("columnheader", { name: "Name" })` | used in `model-browser.spec.ts` | `hal-op-model-browser-col-name` |
| `getByRole("columnheader", { name: "Type" })` | used in `model-browser.spec.ts` | `hal-op-model-browser-col-type` |

**Status:** Open. Column headers in PatternFly Java tables don't support individual OUIA IDs. Use `getByRole` selectors.

## Resolved: Dashboard

Dashboard cards now have OUIA IDs:

| Card              | OUIA ID                              | Status   |
| ----------------- | ------------------------------------ | -------- |
| Overview          | `hal-op-dashboard-overview-card`     | Resolved |
| Deployment        | `hal-op-dashboard-deployment-card`   | Resolved |
| Documentation     | `hal-op-dashboard-documentation-card`| Resolved |
| Health            | `hal-op-dashboard-health-card`       | Resolved |
| Log               | `hal-op-dashboard-log-card`          | Resolved |
| Status            | `hal-op-dashboard-status-card`       | Resolved |
| Runtime (Host/JVM/Memory) | N/A — uses `Flex` layout, not a `Card` | Skipped |

Runtime card uses a `Flex` gallery layout which doesn't support `ouiaId()`. Its sub-cards (Host, JVM, Memory & Threads) are internal helper methods, not standalone components. Use `getByRole("heading")` selectors for these sections.

## Configuration

| Selector                                                   | Page Object             | Suggested OUIA ID                                              |
| ---------------------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `#${MAIN_ID}` + `getByRole("heading", { name, level: 1 })` | `configuration.page.ts` | `hal-op-configuration-heading`                                 |
| `getByRole("tree")`                                        | `configuration.page.ts` | `hal-op-configuration-tree`                                    |
| `getByRole("treeitem", { name, exact: true })`             | `configuration.page.ts` | `hal-op-configuration-tree-item-<name>` (dynamic via `ouia()`) |

**Status:** Open. These are in the configuration module, not the model browser.

## Resolved: Tasks

| Selector                                   | OUIA ID                                  | Status   |
| ------------------------------------------ | ---------------------------------------- | -------- |
| task cards                                 | `hal-op-<task-id>-card` (dynamic)        | Resolved |
