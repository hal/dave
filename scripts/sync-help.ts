/* eslint-disable no-console */
const HELP = `
Sync commands — keep dave in sync with halOP

  pnpm sync:ouia     Fetch OuiaIds.java from GitHub and regenerate src/selectors/ids.ts
  pnpm sync:image    Pull the latest hal-op:test-suite container image
  pnpm sync:status   Check sync state (IDs, CI build, image) and report what needs updating
  pnpm sync:ci       Check OUIA ID drift for CI (fails if ids.ts is out of sync)
  pnpm sync:help     Show this help
`;

console.log(HELP.trimEnd());
