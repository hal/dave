/* eslint-disable no-console */
const HELP = `
Sync commands — keep dave in sync with halOP

  pnpm sync:ouia          Fetch OuiaIds.java and regenerate src/selectors/ids.ts
  pnpm sync:identifiers   Fetch Identifiers.java and regenerate src/selectors/identifiers.ts
  pnpm sync:image         Pull the latest hal-op:test-suite container image
  pnpm sync:status        Check sync state (IDs, identifiers, CI build, image)
  pnpm sync:ci            Check OUIA ID and identifier drift for CI (fails if out of sync)
  pnpm sync:help          Show this help
`;

console.log(HELP.trimEnd());
