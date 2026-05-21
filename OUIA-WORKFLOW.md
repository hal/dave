# Faster OUIA Selector Development Workflow

## Problem

The current cycle for fixing or adding OUIA CSS selectors is heavyweight:

1. Detect a wrong/missing OUIA selector in a test (some tracked in [OUIA-GAPS.md](OUIA-GAPS.md))
2. Add the OUIA selector to [halOP](https://github.com/hal/foundation)
3. Do a full halOP release (required to publish `@halconsole/ouia` package, which has version alignment)
4. Rebuild `quay.io/halconsole/hal-op:test-suite` image (automated by halOP GitHub workflows)
5. Fix the test in dave

A single typo forces the entire cycle again. We need a faster feedback loop.

## Proposed Solutions

### 1. Inject OUIA Attributes via `addInitScript` (Recommended for Quick Iteration)

dave already uses `addInitScript` for OUIA enablement in `basePage`. A small injected script could patch missing or incorrect `data-ouia-component-id` attributes onto DOM elements before tests run.

**Benefits:**

- Validate selector assumptions in minutes, no halOP change needed
- Once proven correct, port the fix to halOP with confidence
- Zero infrastructure cost

**How it would work:**

- Add an init script that queries elements by role/CSS and sets the expected `data-ouia-*` attributes
- Run tests against the patched DOM
- Once selectors are confirmed, implement them properly in halOP

### 2. Build halOP Locally, Skip the Release (Recommended for Validation)

Build the halOP Docker image locally from a working branch, tag it, and point dave at it.

```bash
# In halOP repo
docker build -t hal-op:dev .

# In dave
echo 'HALOP_IMAGE=hal-op:dev' >> .env
pnpm test:smoke
```

**Benefits:**

- Tests real OUIA attributes (not injected stubs)
- Full release only happens once selectors are verified
- Uses existing `HALOP_IMAGE` env var override

### 3. Decouple OUIA Strings from `@halconsole/ouia` (Longer-Term)

If the npm package just exports string constants, maintain a local selector map in dave (e.g., `src/selectors/ouia.ts`). Tests use the local map. Sync with the package periodically, but never block on a release for a typo fix.

**Benefits:**

- dave is never blocked by a halOP release cycle
- Selector changes are testable immediately

**Trade-offs:**

- Risk of drift between dave's map and the actual package
- Need a sync/validation step to catch divergence

### 4. npm Pre-Release Versions

Publish `@halconsole/ouia` as e.g., `0.x.y-dev.1` from a feature branch. Test in dave before cutting a real release.

**Benefits:**

- Cheaper than a full release
- Still uses the real package

**Trade-offs:**

- Still requires the npm publish step
- More process than options 1 or 2

## Recommendation

Combine **option 1** (addInitScript injection) for immediate feedback with **option 2** (local halOP build) for validation before release. Use option 1 to prototype and confirm selectors in minutes, then option 2 to verify the real implementation before committing to a full release.

Consider **option 3** longer-term if OUIA selector churn continues to be a recurring friction point.
