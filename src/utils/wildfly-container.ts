import "./configure-testcontainers.js";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

const DEFAULT_IMAGE = "quay.io/wado/wado-sa:development";
const HTTP_CONTAINER_PORT = 8080;
const MANAGEMENT_CONTAINER_PORT = 9990;
const STARTUP_TIMEOUT_MS = 120_000;

/** Running WildFly container with mapped HTTP and management URLs. */
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

/** Derives a container name from the spec path and browser project (e.g. `dave_smoke_dashboard_chromium`). */
export function containerNameFromSpec(specPath: string, projectName?: string): string {
  const base = `dave_${specPath.replace(/[^a-zA-Z0-9]/g, "_")}`;
  return projectName ? `${base}_${projectName}` : base;
}
