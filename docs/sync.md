# Keeping dave in Sync

dave depends on three upstream artifacts from halOP: OUIA ID constants, identifier constants, and the `hal-op:test-suite` container image. Sync commands keep everything up to date.

## Commands

| Command                 | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `pnpm sync:ouia`        | Fetch `OuiaIds.java` from GitHub and regenerate `src/selectors/ids.ts`             |
| `pnpm sync:identifiers` | Fetch `Identifiers.java` from GitHub and regenerate `src/selectors/identifiers.ts` |
| `pnpm sync:image`       | Pull the latest `hal-op:test-suite` container image                                |
| `pnpm sync:status`      | Check sync state and report what needs updating                                    |
| `pnpm sync:ci`          | Check OUIA ID and identifier drift for CI (fails if out of sync)                   |
| `pnpm sync:help`        | Show sync command help                                                             |

## Typical Workflow

```bash
# Check if everything is up to date
pnpm sync:status

# If OUIA IDs are out of date
pnpm sync:ouia

# If identifiers are out of date
pnpm sync:identifiers

# If the container image is out of date (or a new build just finished)
pnpm sync:image

# Run tests
pnpm test
```

## What `sync:status` Checks

`sync:status` checks four things and prints a verdict:

1. **OUIA IDs** — compares local `src/selectors/ids.ts` against upstream `OuiaIds.java`
2. **Identifiers** — compares local `src/selectors/identifiers.ts` against upstream `Identifiers.java`
3. **CI build** — queries the halOP `test-suite.yml` workflow for the latest run status
4. **Container image** — compares local image digest against the remote registry

If everything is current, you'll see "Ready to test". Otherwise it tells you exactly what to run.

## Element Identification

halOP uses two identification mechanisms for test selectors:

- **OUIA IDs** — from [`OuiaIds.java`](https://github.com/hal/foundation/blob/main/resources/src/main/java/org/jboss/hal/resources/OuiaIds.java) into `src/selectors/ids.ts`. Selector: `[data-ouia-component-id="..."]`. Use for buttons, badges, modals, form items, toolbars.
- **Identifiers** — from [`Identifiers.java`](https://github.com/hal/foundation/blob/main/resources/src/main/java/org/jboss/hal/resources/Identifiers.java) into `src/selectors/identifiers.ts`. Selector: `[data-identifier="..."]`. Use for finder columns/items, breadcrumbs, tabs, tree view items.

Both files contain static constants and dynamic builder functions. Both are committed to git so the project works without running sync first.

The `sync:ci` command is used in CI to detect drift — it regenerates both files from upstream and fails if the result differs from the committed versions.
