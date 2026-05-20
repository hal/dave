# Missing OUIA IDs in halOP

Selectors in dave that still use `getByRole` or CSS because halOP doesn't assign OUIA IDs to these elements yet. Tracked here so OUIA IDs can be added in the [halOP codebase](https://github.com/hal/foundation).

## Model Browser

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

| Selector                                | Page Object             | Suggested OUIA ID                       |
| --------------------------------------- | ----------------------- | --------------------------------------- |
| `${MAIN_CONTENT} h1` (resource heading) | `model-browser.page.ts` | `hal-op-model-browser-resource-heading` |
| breadcrumb nav (`${MAIN_CONTENT} nav`)  | `model-browser.page.ts` | `hal-op-model-browser-breadcrumb`       |
