import "./configure-testcontainers.js";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

const DEFAULT_IMAGE = "quay.io/wado/wado-sa:development";
const HTTP_HOST_PORT = 18080;
const HTTP_CONTAINER_PORT = 8080;
const MANAGEMENT_HOST_PORT = 19990;
const MANAGEMENT_CONTAINER_PORT = 9990;
const STARTUP_TIMEOUT_MS = 120_000;
const JBOSS_CLI_PATH = "/opt/jboss/wildfly/bin/jboss-cli.sh";

export interface WildFlyContainer {
  readonly container: StartedTestContainer;
  readonly managementUrl: string;
}

export async function startWildFlyContainer(name: string): Promise<WildFlyContainer> {
  const image = process.env.WILDFLY_IMAGE ?? DEFAULT_IMAGE;
  const container = await new GenericContainer(image)
    .withName(name)
    .withCommand(["-c", "standalone-no-auth.xml"])
    .withExposedPorts(
      { container: HTTP_CONTAINER_PORT, host: HTTP_HOST_PORT },
      { container: MANAGEMENT_CONTAINER_PORT, host: MANAGEMENT_HOST_PORT },
    )
    .withWaitStrategy(Wait.forLogMessage(/WFLYSRV0025/))
    .withStartupTimeout(STARTUP_TIMEOUT_MS)
    .start();

  const managementUrl = `http://localhost:${MANAGEMENT_HOST_PORT}`;
  return { container, managementUrl };
}

export async function stopWildFlyContainer(wildfly: WildFlyContainer): Promise<void> {
  await wildfly.container.stop();
}

export async function executeCliCommand(wildfly: WildFlyContainer, command: string): Promise<string> {
  const result = await wildfly.container.exec([
    "/bin/sh",
    "-c",
    `${JBOSS_CLI_PATH} --connect --controller=localhost:${MANAGEMENT_CONTAINER_PORT} --commands=${command}`,
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`CLI command failed (exit ${result.exitCode}): ${result.output}`);
  }
  return result.output;
}

export function containerNameFromSpec(specPath: string): string {
  return `dave_${specPath.replace(/[^a-zA-Z0-9]/g, "_")}`;
}
