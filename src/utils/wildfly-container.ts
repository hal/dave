import "./configure-testcontainers.js";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

const DEFAULT_IMAGE = "quay.io/wado/wado-sa:development";
const HTTP_CONTAINER_PORT = 8080;
const MANAGEMENT_CONTAINER_PORT = 9990;
const STARTUP_TIMEOUT_MS = 120_000;
const JBOSS_CLI_PATH = "/opt/jboss/wildfly/bin/jboss-cli.sh";

export interface WildFlyContainer {
  readonly container: StartedTestContainer;
  readonly httpUrl: string;
  readonly managementUrl: string;
}

export async function startWildFlyContainer(name: string): Promise<WildFlyContainer> {
  const image = process.env.WILDFLY_IMAGE ?? DEFAULT_IMAGE;
  const container = await new GenericContainer(image)
    .withName(name)
    .withCommand(["-c", "standalone-no-auth.xml"])
    .withExposedPorts(HTTP_CONTAINER_PORT, MANAGEMENT_CONTAINER_PORT)
    .withWaitStrategy(Wait.forHealthCheck())
    .withStartupTimeout(STARTUP_TIMEOUT_MS)
    .start();

  const httpPort = container.getMappedPort(HTTP_CONTAINER_PORT);
  const managementPort = container.getMappedPort(MANAGEMENT_CONTAINER_PORT);
  return {
    container,
    httpUrl: `http://localhost:${httpPort}`,
    managementUrl: `http://localhost:${managementPort}`,
  };
}

export async function stopWildFlyContainer(wildfly: WildFlyContainer): Promise<void> {
  await wildfly.container.stop();
}

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

export function containerNameFromSpec(specPath: string): string {
  return `dave_${specPath.replace(/[^a-zA-Z0-9]/g, "_")}`;
}
