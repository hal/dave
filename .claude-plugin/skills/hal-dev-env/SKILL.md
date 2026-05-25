---
name: hal-dev-env
description: This skill should be used when the user asks to "start dev environment", "start halop", "start wildfly for dev", "stop dev environment", "dev env status", or invokes /hal-dev-env. Starts and manages a containerized local WildFly + halOP development environment.
metadata:
  version: "0.1.0"
---

# /hal-dev-env — Local Development Environment

Manages a containerized local development environment for halOP (WildFly management console). Provides commands to start, stop, and check the status of WildFly and halOP containers. All operations are idempotent — running `start` when containers are already running will report the current state without re-creating them.

## Tools

This skill uses the following pre-allowed tools:

- **Bash** — Execute shell commands for container management, health checks, and browser launch
- **Read** — Read configuration file `.claude/hal-config.json`
- **Write** — Create configuration file if it doesn't exist
- **Edit** — Update configuration file
- **AskUserQuestion** — Prompt for foundation repository path if not configured

## Arguments

- **No argument or `start`** — Start WildFly and halOP containers (default)
- **`stop`** — Stop and remove both containers
- **`status`** — Check running state and report URLs

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

Detect container runtime using the same logic as `dave/src/utils/container-runtime.ts`:

1. If `DOCKER_HOST` environment variable contains "podman" and `podman` is available → use `podman`
2. Else if `docker` is available → use `docker`
3. Else if `podman` is available → use `podman`
4. Else error: "Neither Docker nor Podman found"

```bash
if [[ "$DOCKER_HOST" == *"podman"* ]] && command -v podman >/dev/null 2>&1; then
  RUNTIME=podman
elif command -v docker >/dev/null 2>&1; then
  RUNTIME=docker
elif command -v podman >/dev/null 2>&1; then
  RUNTIME=podman
else
  echo "ERROR: Neither Docker nor Podman found"
  exit 1
fi
```

## Configuration

The skill requires the path to the `hal/foundation` repository for future workspace integration. Configuration is stored in `.claude/hal-config.json` at the project root.

**Resolution order:**

1. Check if `.claude/hal-config.json` exists and has `foundationDir`
2. Check if `../foundation` exists relative to dave root
3. Prompt user via `AskUserQuestion`: "Enter the absolute path to the hal/foundation repository:"
4. Validate that `$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/` exists
5. Save valid path to `.claude/hal-config.json`

**Configuration file format:**

```json
{
  "foundationDir": "../foundation",
  "devPorts": {
    "halop": 19090,
    "wildfly": 19990
  }
}
```

**Validation:**

```bash
FOUNDATION_DIR="<from config or user input>"
if [ ! -d "$FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/" ]; then
  echo "ERROR: Invalid foundation path. Directory does not exist: $FOUNDATION_DIR/op/console/src/main/java/org/jboss/hal/op/"
  exit 1
fi
```

## Subcommand: `start` (default)

Start WildFly and halOP containers for local development.

### Step 1: Check Running Containers

```bash
WILDFLY_RUNNING=$($RUNTIME ps --filter "name=dave_dev_wildfly" --format "{{.Names}}" 2>/dev/null)
HALOP_RUNNING=$($RUNTIME ps --filter "name=dave_dev_halop" --format "{{.Names}}" 2>/dev/null)

if [ -n "$WILDFLY_RUNNING" ] && [ -n "$HALOP_RUNNING" ]; then
  echo "✓ Both containers already running"
  echo ""
  echo "halOP:    http://localhost:19090"
  echo "WildFly:  http://localhost:19990/management"
  echo "Console:  http://localhost:19090/?connect=http://localhost:19990"
  exit 0
elif [ -n "$WILDFLY_RUNNING" ] || [ -n "$HALOP_RUNNING" ]; then
  echo "⚠ Only one container running. Stopping for fresh start..."
  $RUNTIME rm -f dave_dev_wildfly dave_dev_halop 2>/dev/null || true
fi
```

### Step 2: Clean Up Stale Containers

```bash
echo "Cleaning up stale containers..."
$RUNTIME rm -f dave_dev_wildfly dave_dev_halop 2>/dev/null || true
```

### Step 3: Start WildFly Container

```bash
echo "Starting WildFly container..."
# standalone-no-auth.xml disables management authentication so halOP can connect without credentials
$RUNTIME run -d \
  --name dave_dev_wildfly \
  -p 19990:9990 \
  quay.io/wado/wado-sa:development \
  -c standalone-no-auth.xml

echo "Waiting for WildFly management interface..."
for i in {1..60}; do
  if curl -sf http://localhost:19990/management >/dev/null 2>&1; then
    echo "✓ WildFly ready"
    break
  fi
  sleep 2
  if [ $i -eq 60 ]; then
    echo "ERROR: WildFly health check timeout after 120s"
    $RUNTIME logs dave_dev_wildfly
    exit 1
  fi
done
```

### Step 4: Start halOP Container

```bash
echo "Starting halOP container..."
$RUNTIME run -d \
  --name dave_dev_halop \
  -p 19090:9090 \
  quay.io/halconsole/hal-op:test-suite

echo "Waiting for halOP..."
for i in {1..30}; do
  if curl -sf http://localhost:19090 >/dev/null 2>&1; then
    echo "✓ halOP ready"
    break
  fi
  sleep 2
  if [ $i -eq 30 ]; then
    echo "ERROR: halOP health check timeout after 60s"
    $RUNTIME logs dave_dev_halop
    exit 1
  fi
done
```

### Step 5: Open Browser

```bash
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:19090/?connect=http://localhost:19990"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:19090/?connect=http://localhost:19990"
fi
```

### Step 6: Report Success

```bash
echo ""
echo "✓ Development environment started"
echo ""
echo "halOP:    http://localhost:19090"
echo "WildFly:  http://localhost:19990/management"
echo "Console:  http://localhost:19090/?connect=http://localhost:19990"
echo ""
echo "To stop: /hal-dev-env stop"
```

## Subcommand: `stop`

Stop and remove both containers.

```bash
WILDFLY_RUNNING=$($RUNTIME ps --filter "name=dave_dev_wildfly" --format "{{.Names}}" 2>/dev/null)
HALOP_RUNNING=$($RUNTIME ps --filter "name=dave_dev_halop" --format "{{.Names}}" 2>/dev/null)

if [ -z "$WILDFLY_RUNNING" ] && [ -z "$HALOP_RUNNING" ]; then
  echo "✓ No containers running"
  exit 0
fi

echo "Stopping containers..."
$RUNTIME rm -f dave_dev_wildfly dave_dev_halop 2>/dev/null || true
echo "✓ Containers stopped and removed"
```

## Subcommand: `status`

Check running state and report URLs.

```bash
WILDFLY_RUNNING=$($RUNTIME ps --filter "name=dave_dev_wildfly" --format "{{.Names}}" 2>/dev/null)
HALOP_RUNNING=$($RUNTIME ps --filter "name=dave_dev_halop" --format "{{.Names}}" 2>/dev/null)

if [ -n "$WILDFLY_RUNNING" ] && [ -n "$HALOP_RUNNING" ]; then
  echo "✓ Both containers running"
  echo ""
  echo "halOP:    http://localhost:19090"
  echo "WildFly:  http://localhost:19990/management"
  echo "Console:  http://localhost:19090/?connect=http://localhost:19990"
elif [ -n "$WILDFLY_RUNNING" ]; then
  echo "⚠ Partial: Only WildFly running"
  echo "WildFly:  http://localhost:19990/management"
elif [ -n "$HALOP_RUNNING" ]; then
  echo "⚠ Partial: Only halOP running"
  echo "halOP:    http://localhost:19090"
else
  echo "✗ No containers running"
  echo ""
  echo "To start: /hal-dev-env start"
fi
```

## Error Handling

Handle these error cases:

1. **Container runtime not found** — Exit with clear message: "Neither Docker nor Podman found"
2. **Port already in use** — `$RUNTIME run` will fail with port binding error. Report and suggest checking for existing processes on 19090/19990.
3. **Image pull failure** — `$RUNTIME run` will fail. Report network/registry error.
4. **Container start failure** — Check exit code from `$RUNTIME run`. Report logs with `$RUNTIME logs <container>`.
5. **Health check timeout** — After max retries, dump container logs and exit with error.

Example error handling:

```bash
if ! $RUNTIME run -d --name dave_dev_wildfly -p 19990:9990 quay.io/wado/wado-sa:development -c standalone-no-auth.xml; then
  echo "ERROR: Failed to start WildFly container"
  echo "Check if port 19990 is already in use:"
  lsof -i :19990 || ss -tulpn | grep 19990
  exit 1
fi
```

## Anti-Patterns

**Never:**

- Start containers if both are already running (check first, report URLs)
- Use testcontainers API (this is a shell-based skill, not TypeScript)
- Use default ports 9090/9990 (conflicts with dave test suite and WildFly defaults)
- Auto-invoke this skill from other skills (user must trigger explicitly)
- Leave containers running on error (clean up with `$RUNTIME rm -f`)
- Skip health checks (always poll until ready or timeout)
