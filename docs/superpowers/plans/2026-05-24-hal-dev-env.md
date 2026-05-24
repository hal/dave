# hal-dev-env Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Claude Code plugin with the `hal-dev-env` skill that starts and manages a local WildFly + halOP dev environment for interactive exploration and testing.

**Architecture:** A local Claude Code plugin in `.claude-plugin/` with a single skill (`hal-dev-env`). The skill uses the container runtime auto-detection from dave's existing `container-runtime.ts` logic (Podman preferred, Docker fallback). It manages two named containers (`dave_dev_wildfly`, `dave_dev_halop`) on dedicated ports (19990, 19090) and stores config in `.claude/hal-config.json`.

**Tech Stack:** Claude Code plugin system (YAML frontmatter skills), Podman/Docker CLI, shell commands

---

## File Structure

```
.claude-plugin/
├── plugin.json                    # Plugin manifest (name, version, skills list)
└── skills/
    └── hal-dev-env/
        └── SKILL.md               # Skill definition with full workflow

.claude/
└── hal-config.json                # Created at runtime — halOP path + dev ports
```

No TypeScript files are created — the skill is a markdown instruction file that guides Claude Code through shell commands.

---

### Task 1: Plugin Manifest

**Files:**

- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create the plugin directory**

```bash
mkdir -p .claude-plugin/skills/hal-dev-env
```

- [ ] **Step 2: Create the plugin manifest**

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "hal",
  "version": "0.1.0",
  "description": "Skills for developing and testing halOP — the WildFly management console",
  "skills": [
    {
      "name": "hal-dev-env",
      "path": "skills/hal-dev-env/SKILL.md",
      "description": "Start and manage a local WildFly + halOP dev environment"
    }
  ]
}
```

- [ ] **Step 3: Verify plugin discovery**

Run Claude Code's plugin validation to confirm the manifest is well-formed:

```bash
cat .claude-plugin/plugin.json | python3 -m json.tool
```

Expected: valid JSON output with no errors.

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "feat: scaffold hal plugin with manifest"
```

---

### Task 2: hal-dev-env Skill — Core Structure

**Files:**

- Create: `.claude-plugin/skills/hal-dev-env/SKILL.md`

This task creates the skill file with frontmatter, tool declarations, constants, and the configuration resolution section. The container lifecycle sections are added in Tasks 3–5.

- [ ] **Step 1: Create the skill file with frontmatter and tools**

Create `.claude-plugin/skills/hal-dev-env/SKILL.md`:

````markdown
---
name: hal-dev-env
description: >-
  Start and manage a local WildFly + halOP development environment for
  interactive exploration and testing. Use when the user says /hal-dev-env,
  "start dev environment", "start halop", "start wildfly for dev",
  "stop dev environment", or "dev env status".
metadata:
  version: "0.1.0"
---

# /hal-dev-env — Local Development Environment

Start and manage a local WildFly + halOP environment for interactive exploration and testing. Idempotent — skips startup if containers are already running.

## Tools

### Pre-allowed (no permission prompt)

- **Bash** — Run container runtime commands (podman/docker), check container status, open browser
- **Read** — Read config files
- **Write** — Create config files
- **Edit** — Update config files
- **AskUserQuestion** — Prompt for halOP foundation repo path if not found

## Arguments

- **(no argument)** or **`start`** — Start the dev environment (idempotent)
- **`stop`** — Stop and remove dev containers
- **`status`** — Show whether dev containers are running and their URLs

## Constants

```
WILDFLY_IMAGE       = quay.io/wado/wado-sa:development
HALOP_IMAGE         = quay.io/halconsole/hal-op:test-suite
WILDFLY_CONTAINER   = dave_dev_wildfly
HALOP_CONTAINER     = dave_dev_halop
WILDFLY_MGMT_PORT   = 19990
HALOP_PORT          = 19090
WILDFLY_INTERNAL_MGMT_PORT = 9990
HALOP_INTERNAL_PORT = 9090
CONFIG_FILE         = .claude/hal-config.json
```

## Container Runtime Detection

Detect which container runtime to use. Apply the same logic as dave's `src/utils/container-runtime.ts`:

1. If `DOCKER_HOST` contains "podman" and `podman --version` succeeds → use `podman`
2. Else if `docker --version` succeeds → use `docker`
3. Else if `podman --version` succeeds → use `podman`
4. Else → error: "No container runtime found. Install podman or docker."

Store the detected runtime in a variable (e.g., `RUNTIME`) and use it for all subsequent commands.
````

- [ ] **Step 2: Add the configuration resolution section**

Append to the skill file after the container runtime section:

````markdown
## Configuration

On first use, resolve the halOP foundation repo path and save config.

### Resolution Order

1. Read `.claude/hal-config.json` — if it exists and `foundationDir` points to a valid directory, use it
2. Check `../foundation` relative to dave's root — if it exists and contains `op/console/`, use it
3. Prompt the user with `AskUserQuestion`: "Where is the halOP foundation repo checked out?"
4. Save the resolved path to `.claude/hal-config.json`

### Config File Format

`.claude/hal-config.json`:

```json
{
  "foundationDir": "../foundation",
  "devPorts": {
    "halop": 19090,
    "wildfly": 19990
  }
}
```

### Validation

After resolving the path, verify it's a valid halOP checkout:

```bash
ls "$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/" > /dev/null 2>&1
```

If this fails, tell the user the path doesn't look like a halOP foundation checkout and ask again.
````

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/skills/hal-dev-env/SKILL.md
git commit -m "feat: add hal-dev-env skill with config resolution"
```

---

### Task 3: hal-dev-env Skill — Start Subcommand

**Files:**

- Modify: `.claude-plugin/skills/hal-dev-env/SKILL.md`

Add the start/default subcommand workflow to the skill file.

- [ ] **Step 1: Add the idempotency check section**

Append to the skill file:

````markdown
## Subcommand: `start` (default)

### Step 1: Check Running Containers

Check if both dev containers are already running:

```bash
$RUNTIME ps --filter "name=dave_dev_wildfly" --filter "status=running" --format "{{.Names}}"
$RUNTIME ps --filter "name=dave_dev_halop" --filter "status=running" --format "{{.Names}}"
```

If **both** containers are running, report:

```
Dev environment is already running:
  WildFly management: http://localhost:19990
  halOP console:      http://localhost:19090
  Console URL:        http://localhost:19090/?connect=http://localhost:19990
```

Then **stop** — do not restart containers.

If only one is running, stop and remove it before proceeding with a fresh start (partial state is unreliable).
````

- [ ] **Step 2: Add the container startup section**

Append to the skill file:

````markdown
### Step 2: Clean Up Stale Containers

Remove any stopped dev containers from previous runs:

```bash
$RUNTIME rm -f dave_dev_wildfly 2>/dev/null || true
$RUNTIME rm -f dave_dev_halop 2>/dev/null || true
```

### Step 3: Start WildFly

Start a WildFly container with the `standalone-no-auth` configuration:

```bash
$RUNTIME run -d \
  --name dave_dev_wildfly \
  -p 19990:9990 \
  quay.io/wado/wado-sa:development \
  -c standalone-no-auth.xml
```

Wait for WildFly to be ready by polling the management endpoint:

```bash
for i in $(seq 1 60); do
  if curl -sf http://localhost:19990/management > /dev/null 2>&1; then
    break
  fi
  sleep 2
done
```

If the loop exits without success, report an error: "WildFly failed to start within 120 seconds. Check container logs with: `$RUNTIME logs dave_dev_wildfly`"

### Step 4: Start halOP

Start the halOP console container:

```bash
$RUNTIME run -d \
  --name dave_dev_halop \
  -p 19090:9090 \
  quay.io/halconsole/hal-op:test-suite
```

Wait for halOP to be ready:

```bash
for i in $(seq 1 30); do
  if curl -sf http://localhost:19090 > /dev/null 2>&1; then
    break
  fi
  sleep 2
done
```

If the loop exits without success, report an error: "halOP failed to start within 60 seconds. Check container logs with: `$RUNTIME logs dave_dev_halop`"
````

- [ ] **Step 3: Add the browser open and summary section**

Append to the skill file:

````markdown
### Step 5: Open Browser

Open the halOP console connected to the local WildFly instance:

```bash
open "http://localhost:19090/?connect=http://localhost:19990"
```

On Linux, use `xdg-open` instead of `open`.

### Step 6: Report

```
Dev environment started:
  WildFly management: http://localhost:19990
  halOP console:      http://localhost:19090
  Console URL:        http://localhost:19090/?connect=http://localhost:19990

The browser should open automatically. If not, open the Console URL above.
```
````

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/skills/hal-dev-env/SKILL.md
git commit -m "feat: add start subcommand to hal-dev-env skill"
```

---

### Task 4: hal-dev-env Skill — Stop Subcommand

**Files:**

- Modify: `.claude-plugin/skills/hal-dev-env/SKILL.md`

- [ ] **Step 1: Add the stop subcommand**

Append to the skill file:

````markdown
## Subcommand: `stop`

Stop and remove both dev containers:

```bash
$RUNTIME stop dave_dev_wildfly 2>/dev/null && $RUNTIME rm dave_dev_wildfly 2>/dev/null || true
$RUNTIME stop dave_dev_halop 2>/dev/null && $RUNTIME rm dave_dev_halop 2>/dev/null || true
```

Report:

```
Dev environment stopped.
```

If neither container was running, report:

```
Dev environment is not running.
```
````

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/skills/hal-dev-env/SKILL.md
git commit -m "feat: add stop subcommand to hal-dev-env skill"
```

---

### Task 5: hal-dev-env Skill — Status Subcommand

**Files:**

- Modify: `.claude-plugin/skills/hal-dev-env/SKILL.md`

- [ ] **Step 1: Add the status subcommand**

Append to the skill file:

````markdown
## Subcommand: `status`

Check and report the state of dev containers:

```bash
WILDFLY_RUNNING=$($RUNTIME ps --filter "name=dave_dev_wildfly" --filter "status=running" --format "{{.Names}}" 2>/dev/null)
HALOP_RUNNING=$($RUNTIME ps --filter "name=dave_dev_halop" --filter "status=running" --format "{{.Names}}" 2>/dev/null)
```

If both are running:

```
Dev environment is running:
  WildFly management: http://localhost:19990
  halOP console:      http://localhost:19090
  Console URL:        http://localhost:19090/?connect=http://localhost:19990
```

If only one is running, report which one and suggest running `/hal-dev-env stop` then `/hal-dev-env` to get a clean state.

If neither is running:

```
Dev environment is not running. Use /hal-dev-env to start it.
```
````

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/skills/hal-dev-env/SKILL.md
git commit -m "feat: add status subcommand to hal-dev-env skill"
```

---

### Task 6: hal-dev-env Skill — Error Handling and Anti-Patterns

**Files:**

- Modify: `.claude-plugin/skills/hal-dev-env/SKILL.md`

- [ ] **Step 1: Add error handling and anti-patterns sections**

Append to the skill file:

```markdown
## Error Handling

- **Container runtime not found**: Report clearly which runtimes were checked. Suggest installing podman or docker.
- **Port already in use**: If `$RUNTIME run` fails with a port binding error, report which port is conflicting and suggest:
  - Check what's using the port: `lsof -i :19990` or `lsof -i :19090`
  - Stop the conflicting process or adjust ports in `.claude/hal-config.json`
- **Image pull failure**: If the image isn't available locally and pull fails, report the error and suggest checking network connectivity or image availability.
- **Container start failure**: Show the container logs (`$RUNTIME logs <name>`) and suggest common fixes.
- **Health check timeout**: Report which container failed to become ready and show its logs.

## Anti-Patterns

- **Never start containers if both are already running** — the idempotency check must short-circuit
- **Never use testcontainers** — the dev environment uses direct container runtime commands, not the testcontainers library (that's for dave's test fixtures)
- **Never use ports 9090 or 9990** — those are reserved for dave's test containers and WildFly defaults; the dev environment uses 19090 and 19990
- **Never auto-invoke from other skills** — other skills should tell the user to run `/hal-dev-env` manually
```

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/skills/hal-dev-env/SKILL.md
git commit -m "feat: add error handling to hal-dev-env skill"
```

---

### Task 7: Verify Plugin Discovery and Test

**Files:**

- Verify: `.gitignore` (may need modification)

- [ ] **Step 1: Verify .gitignore does not exclude the plugin**

Check that `.claude-plugin/` is not ignored by git:

```bash
git check-ignore .claude-plugin/plugin.json
git check-ignore .claude-plugin/skills/hal-dev-env/SKILL.md
```

Expected: no output (files are NOT ignored). If they are ignored, add an exception to `.gitignore`:

```
!.claude-plugin/
```

- [ ] **Step 2: Test the skill manually**

Verify the skill can be invoked by running `/hal-dev-env status` in Claude Code. Expected behavior:

1. Claude Code discovers the plugin from `.claude-plugin/plugin.json`
2. The skill loads from `skills/hal-dev-env/SKILL.md`
3. Claude detects the container runtime (podman or docker)
4. Claude checks for running containers and reports status

- [ ] **Step 3: Test the full start/stop cycle**

1. Run `/hal-dev-env` — should start both containers, open browser
2. Run `/hal-dev-env status` — should report both containers running with URLs
3. Run `/hal-dev-env` again — should report already running and skip
4. Run `/hal-dev-env stop` — should stop and remove both containers
5. Run `/hal-dev-env status` — should report not running

- [ ] **Step 4: Commit any .gitignore changes**

```bash
git add .gitignore
git commit -m "chore: ensure plugin files are tracked by git"
```

Only commit if `.gitignore` was modified.

---

### Task 8: Final Review

**Files:**

- Verify: `.claude-plugin/plugin.json`
- Verify: `.claude-plugin/skills/hal-dev-env/SKILL.md`

- [ ] **Step 1: Review the complete skill file**

Read through the entire SKILL.md and verify:

- Frontmatter is valid YAML with name, description, metadata.version
- All three subcommands are documented (start, stop, status)
- Container names match: `dave_dev_wildfly`, `dave_dev_halop`
- Ports match: 19990 (WildFly management), 19090 (halOP)
- Images match: `quay.io/wado/wado-sa:development`, `quay.io/halconsole/hal-op:test-suite`
- Config file path is `.claude/hal-config.json`
- Container runtime detection matches dave's logic

- [ ] **Step 2: Run lint and format checks**

```bash
pnpm format:check
pnpm lint
```

Expected: no errors. The plugin files are markdown/JSON, so they should pass Prettier. Fix any issues.

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git status
```

If there are uncommitted changes, commit them:

```bash
git commit -m "docs: finalize hal-dev-env skill"
```
