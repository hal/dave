# Test Scenario Proposal Format

After completing Phase 1 (and optionally Phase 2), propose concrete test scenarios for each gap. Each proposal includes the sections below.

## Proposal Template

````markdown
## Proposed Test: <feature> / <scenario>

**Priority:** HIGH | MEDIUM | LOW
**Gap Type:** FULL GAP | NEEDS TESTS | NEEDS PAGE | DEPTH GAP
**halOP Feature:** <feature directory name>

### Page Object

**File:** `src/pages/<feature>.page.ts`
**Extends:** `BasePage`

Key locators needed:

- `<element>` → `ouiaSelector(ids.<CONSTANT>)` or `page.getByRole(...)`

### Test File

**File:** `src/tests/<category>/<feature>.spec.ts`
**Tags:** `[Tag.<TAG>]`
**Spec path:** `<category>/<feature>`

### DMR Setup/Teardown

Operations needed before/after tests:

```typescript
// Setup — add test resources
await addResource(managementUrl, ["subsystem", "example"], { attr: "value" });

// Teardown — clean up
await removeResource(managementUrl, ["subsystem", "example"]);
```

### Test Cases

1. **<test name>** — <what it verifies>
   - Navigate to <page>
   - Assert <element> is visible
   - Perform <action>
   - Verify <result>

2. **<test name>** — <what it verifies>
   - ...
````

## Prioritization Criteria

Order proposals by:

1. **User impact** — features used most frequently (dashboard, configuration, runtime)
2. **Testability** — features with OUIA IDs already available
3. **Complexity** — simpler scenarios first, building toward complex flows
4. **DMR dependency** — tests needing minimal setup preferred

## Output

Present all proposals in a single report. If the output is large, save to `docs/explore-report-<date>.md` for reference.
