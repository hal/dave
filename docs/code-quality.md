# Code Quality

## Linting

### ESLint

ESLint checks TypeScript and JavaScript files using TypeScript-aware rules and [Playwright-specific](https://github.com/playwright-community/eslint-plugin-playwright) rules (e.g., no standalone `expect`, proper `await` on assertions).

| Command         | Description              |
| --------------- | ------------------------ |
| `pnpm lint`     | Run ESLint               |
| `pnpm lint:fix` | Run ESLint with auto-fix |

Configuration: `eslint.config.js`

### Markdownlint

Markdownlint checks markdown files in `docs/` and the project root. Several rules are relaxed for VitePress compatibility (long lines, inline HTML, duplicate headings).

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `pnpm lint:md`     | Lint markdown files            |
| `pnpm lint:md:fix` | Lint markdown files, auto-fix  |

Configuration: `.markdownlint-cli2.jsonc`

## Formatting

Prettier handles all code formatting. It runs on TypeScript, JavaScript, JSON, YAML, CSS, and markdown files.

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `pnpm format`        | Format all files with Prettier    |
| `pnpm format:check`  | Check formatting without changing |

Configuration: `.prettierrc`

## Git Hooks

A pre-commit hook runs linting and formatting checks automatically on every commit. Three packages work together to make this happen:

```text
git commit
  └─ .git/hooks/pre-commit          (created by simple-git-hooks)
       └─ pnpm lint-staged           (runs lint-staged CLI)
            └─ lint-staged.config.mjs (defines which tools run on which files)
```

### How It Works

1. **[simple-git-hooks](https://github.com/toplenboren/simple-git-hooks)** reads the `"simple-git-hooks"` section in `package.json` and writes a shell script to `.git/hooks/pre-commit`. The script calls `pnpm lint-staged`.

2. **[lint-staged](https://github.com/lint-staged/lint-staged)** picks up `lint-staged.config.mjs` by naming convention. It runs the configured tools only on **staged files**, so commits stay fast regardless of project size.

3. **`lint-staged.config.mjs`** defines the rules:

   | File Pattern                      | Tools            |
   | --------------------------------- | ---------------- |
   | `*.{ts,js,mjs,cjs}`               | ESLint, Prettier |
   | `*.{json,yml,yaml,css}`           | Prettier         |
   | `*.md` (excl. `.claude-plugin/`)  | markdownlint     |
   | `.prettierrc`                     | Prettier         |

### Regenerating Hooks

Changes to the `"simple-git-hooks"` config in `package.json` are **not** picked up automatically. After modifying the hook configuration, run:

```bash
npx simple-git-hooks
```

This regenerates the `.git/hooks/pre-commit` script from the updated config.

### First-Time Setup

After cloning the repository, the git hook doesn't exist yet. Running `pnpm install` does **not** set it up automatically. To install the hook:

```bash
npx simple-git-hooks
```

## Config Files

| File                                  | Purpose                                |
| ------------------------------------- | -------------------------------------- |
| `eslint.config.js`                    | ESLint rules (TypeScript + Playwright) |
| `.prettierrc`                         | Prettier formatting options            |
| `.prettierignore`                     | Files excluded from Prettier           |
| `.markdownlint-cli2.jsonc`            | Markdownlint rules and file globs      |
| `lint-staged.config.mjs`              | Pre-commit checks per file type        |
| `package.json` (`simple-git-hooks`)   | Maps git hooks to commands             |
