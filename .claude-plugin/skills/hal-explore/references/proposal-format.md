# Test Scenario Proposal Format

After completing Phase 1 (and optionally Phase 2), propose concrete test scenarios for each gap. Each proposal must follow the format below — it is the same format that `/hal-implement` and `/hal-record` use, so proposals can be handed directly to `/hal-implement` without reformatting.

## Proposal Template

````markdown
## Proposed Test: <feature> / <scenario>

**Source:** Identified via /hal-explore gap analysis
**Priority:** HIGH | MEDIUM | LOW
**Gap Type:** FULL GAP | NEEDS TESTS | NEEDS PAGE | DEPTH GAP
**Category:** <test directory name, e.g., "configuration", "runtime", "deployment">
**Tags:** [Tag.<TAG>.value, ...]
**Spec path:** <category>/<name>

### Page Object

**Status:** NEW — `src/pages/<name>.page.ts` | EXTEND — `src/pages/<existing>.page.ts`

Locators:

- `heading` → `page.locator('#hal-main').getByRole('heading', { name: '<Name>', level: 1 })`
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

1. **<test name>** — <what it verifies>
   - Navigate to <page>
   - Assert <element> is visible
   - Perform <action>
   - Verify <result>

2. **<test name>** — <what it verifies>
   - ...

### DMR Setup/Teardown

```typescript
// Setup — add test resources
await addResource(managementUrl, ["subsystem", "example"], { attr: "value" });

// Teardown — clean up
await removeResource(managementUrl, ["subsystem", "example"]);
```

### OUIA Coverage

- Matched: <OUIA IDs found in ids.ts with their constant names>
- Unmatched: <OUIA IDs in the DOM but not in ids.ts>
- Non-OUIA selectors: <role/text selectors used because no OUIA ID exists>
- Missing: <elements that need OUIA IDs — requires /hal-ouia>
````

## Prioritization Criteria

Order proposals by:

1. **User impact** — features used most frequently (dashboard, configuration, runtime)
2. **Testability** — features with OUIA IDs already available
3. **Complexity** — simpler scenarios first, building toward complex flows
4. **DMR dependency** — tests needing minimal setup preferred

## Output

Present all proposals in a single report. If the output is large, save to `docs/explore-report-<date>.md` for reference.
