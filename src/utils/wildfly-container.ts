import "./configure-testcontainers.js";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

const DEFAULT_IMAGE = "quay.io/wado/wado-sa:development";
const HTTP_CONTAINER_PORT = 8080;
const MANAGEMENT_CONTAINER_PORT = 9990;
const STARTUP_TIMEOUT_MS = 120_000;
const JBOSS_CLI_PATH = "/opt/jboss/wildfly/bin/jboss-cli.sh";
const HEALTHCHECK_CMD = [
  "CMD-SHELL",
  `curl -sf http://localhost:${MANAGEMENT_CONTAINER_PORT}/health/ready || ` +
    `curl -s -o /dev/null -w '%{http_code}' http://localhost:${MANAGEMENT_CONTAINER_PORT}/management | ` +
    `grep -qE '^([23]|401|403)' || exit 1`,
] as const;

/** Running WildFly container with mapped HTTP and management URLs. */
export interface WildFlyContainer {
  readonly container: StartedTestContainer;
  readonly httpUrl: string;
  readonly managementUrl: string;
  /** Management URL reachable from other containers on the shared network. */
  readonly managementInternalUrl: string;
}

export async function startWildFlyContainer(name: string, networkName?: string): Promise<WildFlyContainer> {
  const image = process.env.WILDFLY_IMAGE ?? DEFAULT_IMAGE;
  let builder = new GenericContainer(image)
    .withName(name)
    .withCommand(["-c", "standalone-no-auth.xml"])
    .withExposedPorts(HTTP_CONTAINER_PORT, MANAGEMENT_CONTAINER_PORT)
    .withHealthCheck({
      test: [...HEALTHCHECK_CMD],
      interval: 5_000,
      timeout: 3_000,
      retries: 20,
      startPeriod: 30_000,
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .withStartupTimeout(STARTUP_TIMEOUT_MS);

  if (networkName) {
    builder = builder.withNetworkMode(networkName);
  }

  const container = await builder.start();
  const httpPort = container.getMappedPort(HTTP_CONTAINER_PORT);
  const managementPort = container.getMappedPort(MANAGEMENT_CONTAINER_PORT);
  return {
    container,
    httpUrl: `http://localhost:${httpPort}`,
    managementUrl: `http://localhost:${managementPort}`,
    managementInternalUrl: networkName
      ? `http://${name}:${MANAGEMENT_CONTAINER_PORT}`
      : `http://localhost:${managementPort}`,
  };
}

export async function stopWildFlyContainer(wildfly: WildFlyContainer): Promise<void> {
  await wildfly.container.stop();
}

/** Runs a JBoss CLI command inside the container and returns stdout. */
export async function executeCliCommand(wildfly: WildFlyContainer, command: string): Promise<string> {
  const result = await wildfly.container.exec([
    JBOSS_CLI_PATH,
    `--connect`,
    `--controller=localhost:${MANAGEMENT_CONTAINER_PORT}`,
    `--commands=${command}`,
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`CLI command failed (exit ${result.exitCode}): ${result.output}`);
  }
  return result.output;
}

/** Derives a container name from the spec path and browser project (e.g. `dave_smoke_dashboard_chromium`). */
export function containerNameFromSpec(specPath: string, projectName?: string): string {
  const base = `dave_${specPath.replace(/[^a-zA-Z0-9]/g, "_")}`;
  return projectName ? `${base}_${projectName}` : base;
}
