# OUIA ID Refactoring — Tracking Sheet

**Date:** 2026-05-25 (started) / 2026-05-26 (completed)  
**Repositories:** `hal/foundation` (halOP), `hal/dave` (test suite)

---

## Progress Tracker

### Phase 1 — Consolidate OUIA IDs in halOP (DONE)

- [x] Create `OuiaIds.java` — all static OUIA ID constants + `ouia()` composition method
- [x] Migrate all `Ids.*` OUIA references to `OuiaIds.*` across 40 files
- [x] Replace context-based `ouia(context, suffix...)` calls with flat static constants for singleton components
- [x] Remove `ouiaContext` parameter from `ResourceToolbar`
- [x] Remove `templateContext()` method from `ResourceDialogs`
- [x] Remove `OuiaSuffixes.java` and `OuiaContexts.java` (folded into `OuiaIds.java`)
- [x] Remove migrated OUIA constants and suffixes from `Ids.java`
- [x] Add `MAIN = "hal-op-main"` OUIA ID to `OuiaIds.java`
- [x] Add `.ouiaId(OuiaIds.MAIN)` to `Skeleton.java` and `ErrorSkeleton.java` (alongside existing `Ids.MAIN_ID`)
- [x] Verify halOP compiles (`./mvnw compile` → BUILD SUCCESS)

### Phase 2 — Update dave sync script (DONE)

- [x] Update `parse-ids.ts` URL to fetch `OuiaIds.java` (instead of `Ids.java`)
- [x] Update `emit-ids.ts` generated comment to reference `OuiaIds.java`
- [x] Update `sync-ouia.ts`, `sync-ci.ts`, `sync-help.ts` log messages

### Phase 3 — Regenerate ids.ts and update dave consumers (DONE)

- [x] Regenerate `ids.ts` with 78 constants + `ouia()` function
- [x] Update `pages.fixture.ts` — `MAIN_ID` → `MAIN` + `ouiaSelector()`
- [x] Update all page objects — `MAIN_ID` → `MAIN` in imports and locators
- [x] Update `navigation.spec.ts` — `#${MAIN_ID}` → `ouiaSelector(MAIN)`
- [x] Verify lint passes with no errors

### Phase 4 — Update docs and skills (IN PROGRESS)

- [ ] Update `CLAUDE.md` references to `Ids.java`
- [ ] Update `docs/architecture.md`, `docs/sync.md`, `docs/writing-tests.md`, `docs/skills.md`, `docs/ci-cd.md`
- [ ] Update `.claude-plugin/skills/hal-ouia/SKILL.md` and `references/conventions.md`

---

## Summary

### What changed

The original plan called for three separate files (`OuiaIds.java`, `OuiaSuffixes.java`, `OuiaContexts.java`). During implementation, the design was simplified: **all OUIA IDs live in a single `OuiaIds.java`**. Suffixes and contexts were folded in as static constants. The three-file approach was unnecessary because:

1. **Flat IDs for singleton components** — Generic components (ResourceDialogs, ResourceToolbar, ResourceManager, ResourceList) appear as singletons on screen. Context-based disambiguation (`hal-op-data-source-add-modal` vs `hal-op-system-property-add-modal`) was unnecessary. Flat IDs like `ADD_MODAL`, `RESET_BTN` are unique on the page.

2. **Few remaining dynamic IDs** — Only multi-instance components (BuildingBlocks.crudColumn, OperationsTable, TasksPage) still use `ouia()` composition, and their contexts/suffixes are simple string literals at the call site.

### File structure (final)

```
hal/foundation:
  resources/src/main/java/org/jboss/hal/resources/
  ├── OuiaIds.java  — 78 static OUIA ID constants + ouia() method (synced to dave)
  └── Ids.java      — non-OUIA IDs only: COOKIE, MAIN_ID, STANDALONE_HOST, STANDALONE_SERVER, hostServer()

hal/dave:
  src/selectors/ids.ts  — generated from OuiaIds.java via pnpm sync:ouia
```

### Constants removed from dave's `ids.ts`

- `COOKIE`, `MAIN_ID`, `STANDALONE_HOST`, `STANDALONE_SERVER`, `hostServer()` — non-OUIA IDs, no longer synced

### Constants added to dave's `ids.ts`

- `ADD_BTN`, `ADD_MODAL`, `CANCEL_BTN`, `CLOSE_BTN`, `DELETE_BTN`, `DELETE_MODAL`, `EDIT_BTN`, `EXECUTE_BTN`, `EXECUTE_MODAL`, `MAIN`, `REFRESH_BTN`, `RESET_BTN`, `SAVE_BTN`

### MAIN container change

The main container in halOP now has both:

- HTML `id="hal-main-id"` (via `Ids.MAIN_ID`) — used for navigation, skip-to-content
- OUIA attribute `data-ouia-component-id="hal-op-main"` (via `OuiaIds.MAIN`) — used for test selectors

Dave tests use `ouiaSelector(MAIN)` instead of `#${MAIN_ID}`.
