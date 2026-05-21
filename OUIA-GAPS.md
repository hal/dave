# Missing OUIA IDs in halOP

Selectors in dave that still use `getByRole` or CSS because halOP doesn't assign OUIA IDs to these elements yet. Tracked here so OUIA IDs can be added in the [halOP codebase](https://github.com/hal/foundation).

## Resolved: Stale console.js

~~The compiled `console.js` used non-standard OUIA attribute names. Fixed in PF Java v0.8.3 (commit `affa7902`). The `test-suite` image was rebuilt successfully and now renders correct `data-ouia-component-id` / `data-ouia-component-type` attributes.~~

**Status:** Resolved. OUIA selectors are working and used in `navigation.page.ts` and `dashboard.page.ts`.

## pageMain Does Not Set OUIA ID

`pageMain(Ids.MAIN_ID)` in `Skeleton.java:111` sets the HTML `id` attribute (`id="hal-main-id"`), **not** `data-ouia-component-id`. The `<main>` element does not participate in OUIA.

**Workaround:** Use `main` element selector instead of OUIA selector.

**Fix:** Add `.ouiaId(Ids.MAIN_ID)` to the `pageMain` call in `Skeleton.java`, or chain it on the `PageMain` instance if `PageSubComponent` supports `OuiaSupport`.

## Model Browser

The following elements use `getByRole` or CSS selectors and would benefit from dedicated OUIA IDs:

### Tree

| Selector                          | Page Object             | Suggested OUIA ID                                              |
| --------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `getByRole("tree")`               | `model-browser.page.ts` | `hal-op-model-browser-tree`                                    |
| `getByRole("treeitem", { name })` | `model-browser.page.ts` | `hal-op-model-browser-tree-item-<name>` (dynamic via `ouia()`) |

### Tabs

| Selector                                     | Page Object             | Suggested OUIA ID                       |
| -------------------------------------------- | ----------------------- | --------------------------------------- |
| `getByRole("tab", { name: "Data" })`         | `model-browser.page.ts` | `hal-op-model-browser-tab-data`         |
| `getByRole("tab", { name: "Attributes" })`   | `model-browser.page.ts` | `hal-op-model-browser-tab-attributes`   |
| `getByRole("tab", { name: "Operations" })`   | `model-browser.page.ts` | `hal-op-model-browser-tab-operations`   |
| `getByRole("tab", { name: "Capabilities" })` | `model-browser.page.ts` | `hal-op-model-browser-tab-capabilities` |
| `getByRole("tabpanel", { name })`            | `model-browser.page.ts` | `hal-op-model-browser-tabpanel-<name>`  |

### Controls

| Selector                                                  | Page Object             | Suggested OUIA ID                        |
| --------------------------------------------------------- | ----------------------- | ---------------------------------------- |
| `getByRole("switch", { name: "Show global operations" })` | `model-browser.page.ts` | `hal-op-model-browser-global-ops-switch` |
| `getByRole("textbox", { name: "Filter by name" })`        | `model-browser.page.ts` | `hal-op-model-browser-filter`            |

### Table Headers

| Selector                                      | Page Object                     | Suggested OUIA ID               |
| --------------------------------------------- | ------------------------------- | ------------------------------- |
| `getByRole("columnheader", { name: "Name" })` | used in `model-browser.spec.ts` | `hal-op-model-browser-col-name` |
| `getByRole("columnheader", { name: "Type" })` | used in `model-browser.spec.ts` | `hal-op-model-browser-col-type` |

## Resource Detail

| Selector                                                                | Page Object             | Suggested OUIA ID                       |
| ----------------------------------------------------------------------- | ----------------------- | --------------------------------------- |
| `#${MAIN_ID}` + `getByRole("heading", { level: 1 })` (resource heading) | `model-browser.page.ts` | `hal-op-model-browser-resource-heading` |
| breadcrumb nav (`#${MAIN_ID} nav`)                                      | `model-browser.page.ts` | `hal-op-model-browser-breadcrumb`       |

## Dashboard

Section headings and card areas use `getByRole` because the dashboard cards don't have OUIA IDs.

| Selector                                                        | Page Object         | Suggested OUIA ID                    |
| --------------------------------------------------------------- | ------------------- | ------------------------------------ |
| `getByRole("heading", { name: "Overview", level: 2 })`          | `dashboard.page.ts` | `hal-op-dashboard-overview`          |
| `getByRole("heading", { name: "Host", level: 2 })`              | `dashboard.page.ts` | `hal-op-dashboard-host`              |
| `getByRole("heading", { name: "JVM", level: 2 })`               | `dashboard.page.ts` | `hal-op-dashboard-jvm`               |
| `getByRole("heading", { name: "Memory & Threads", level: 2 })`  | `dashboard.page.ts` | `hal-op-dashboard-memory`            |
| `getByRole("heading", { name: "server.log", level: 2 })`        | `dashboard.page.ts` | `hal-op-dashboard-log`               |
| `getByRole("heading", { name: "General Resources", level: 2 })` | `dashboard.page.ts` | `hal-op-dashboard-general-resources` |
| `getByRole("heading", { name: "Get Help", level: 2 })`          | `dashboard.page.ts` | `hal-op-dashboard-get-help`          |

## Configuration

| Selector                                                   | Page Object             | Suggested OUIA ID                                              |
| ---------------------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `#${MAIN_ID}` + `getByRole("heading", { name, level: 1 })` | `configuration.page.ts` | `hal-op-configuration-heading`                                 |
| `getByRole("tree")`                                        | `configuration.page.ts` | `hal-op-configuration-tree`                                    |
| `getByRole("treeitem", { name, exact: true })`             | `configuration.page.ts` | `hal-op-configuration-tree-item-<name>` (dynamic via `ouia()`) |

## Tasks

| Selector                                   | Page Object     | Suggested OUIA ID                                |
| ------------------------------------------ | --------------- | ------------------------------------------------ |
| `getByRole("heading", { name, level: 2 })` | `tasks.page.ts` | `hal-op-task-card-<name>` (dynamic via `ouia()`) |
