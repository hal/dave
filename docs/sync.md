# Keeping dave in Sync

dave depends on two upstream artifacts from halOP: OUIA ID constants and the `hal-op:test-suite` container image. Three sync commands keep everything up to date.

## Commands

| Command            | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm sync:ouia`   | Fetch `Ids.java` from GitHub and regenerate `src/selectors/ids.ts` |
| `pnpm sync:image`  | Pull the latest `hal-op:test-suite` container image                |
| `pnpm sync:status` | Check sync state and report what needs updating                    |
| `pnpm sync:ci`     | Check OUIA ID drift for CI (fails if `ids.ts` is out of sync)      |
| `pnpm sync:help`   | Show sync command help                                             |

## Typical Workflow

```bash
# Check if everything is up to date
pnpm sync:status

# If OUIA IDs are out of date
pnpm sync:ouia

# If the container image is out of date (or a new build just finished)
pnpm sync:image

# Run tests
pnpm test
```

## What `sync:status` Checks

`sync:status` checks three things and prints a verdict:

1. **OUIA IDs** — compares local `src/selectors/ids.ts` against upstream `Ids.java`
2. **CI build** — queries the halOP `test-suite.yml` workflow for the latest run status
3. **Container image** — compares local image digest against the remote registry

If everything is current, you'll see "Ready to test". Otherwise it tells you exactly what to run.

## OUIA ID Sync Details

OUIA ID constants in `src/selectors/ids.ts` are generated from [`Ids.java`](https://github.com/hal/foundation/blob/main/resources/src/main/java/org/jboss/hal/resources/Ids.java) in the hal/foundation repository. The generated file is committed to git so the project works without running sync first.

The `sync:ci` command is used in CI to detect drift — it regenerates `ids.ts` from upstream and fails if the result differs from the committed file.
