import { existsSync } from "node:fs";
import os from "node:os";

function isPodmanHost(dockerHost: string): boolean {
  return dockerHost.includes("podman");
}

function disableRyuk(): void {
  if (!process.env.TESTCONTAINERS_RYUK_DISABLED) {
    process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
  }
}

function configureContainerRuntime(): void {
  if (process.env.DOCKER_HOST) {
    if (isPodmanHost(process.env.DOCKER_HOST)) {
      disableRyuk();
    }
    return;
  }

  const uid = os.userInfo().uid;
  const podmanSocketPaths = [`/run/user/${uid}/podman/podman.sock`, "/var/run/podman/podman.sock"];

  for (const socketPath of podmanSocketPaths) {
    if (existsSync(socketPath)) {
      process.env.DOCKER_HOST = `unix://${socketPath}`;
      disableRyuk();
      return;
    }
  }
}

configureContainerRuntime();
