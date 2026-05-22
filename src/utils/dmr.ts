/** Address segments for a DMR operation, e.g. ["system-property", "foo"]. */
export type DmrAddress = readonly string[];

interface DmrRequest {
  readonly operation: string;
  readonly address: DmrAddress;
  readonly [key: string]: unknown;
}

interface DmrResponse {
  readonly outcome: "success" | "failed";
  readonly result?: unknown;
  readonly "failure-description"?: string;
}

/** Executes a DMR operation via HTTP POST to the WildFly management API. Throws on failure. */
export async function dmr(managementUrl: string, request: DmrRequest): Promise<DmrResponse> {
  const response = await fetch(`${managementUrl}/management`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = (await response.json()) as DmrResponse;
  if (data.outcome === "failed") {
    throw new Error(data["failure-description"] ?? "DMR operation failed");
  }
  return data;
}

/** Reads the full resource at the given address. Returns the result object. */
export async function readResource(managementUrl: string, address: DmrAddress): Promise<unknown> {
  const response = await dmr(managementUrl, { operation: "read-resource", address });
  return response.result;
}

/** Reads a single attribute value. */
export async function readAttribute(managementUrl: string, address: DmrAddress, name: string): Promise<unknown> {
  const response = await dmr(managementUrl, { operation: "read-attribute", address, name });
  return response.result;
}

/** Writes an attribute value. */
export async function writeAttribute(
  managementUrl: string,
  address: DmrAddress,
  name: string,
  value: unknown,
): Promise<void> {
  await dmr(managementUrl, { operation: "write-attribute", address, name, value });
}

/** Adds a resource at the given address with optional parameters. */
export async function addResource(
  managementUrl: string,
  address: DmrAddress,
  params?: Record<string, unknown>,
): Promise<void> {
  await dmr(managementUrl, { operation: "add", address, ...params });
}

/** Removes a resource at the given address. */
export async function removeResource(managementUrl: string, address: DmrAddress): Promise<void> {
  await dmr(managementUrl, { operation: "remove", address });
}

/** Returns true if the address exists in the management model. */
export async function resourceExists(managementUrl: string, address: DmrAddress): Promise<boolean> {
  const response = await dmr(managementUrl, {
    operation: "validate-address",
    address: [],
    value: address,
  });
  return (response.result as { valid: boolean }).valid;
}
