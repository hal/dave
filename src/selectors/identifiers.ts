// Generated from Identifiers.java — do not edit. Run pnpm sync:identifiers to regenerate.

// ------------------------------------------------------ ID builder

function asId(text: string): string | null {
  const parts = text.split(/[-\s]/);
  const sanitized: string[] = [];
  for (const part of parts) {
    if (part) {
      let s = part.replaceAll(/\s+/g, "");
      s = s.replaceAll(/[^a-zA-Z0-9\-_]/g, "");
      s = s.replaceAll("_", "-");
      if (s.length > 0) {
        sanitized.push(s);
      }
    }
  }
  if (sanitized.length === 0) {
    return null;
  }
  return sanitized
    .filter((s) => s && s.trim().length > 0)
    .map((s) => s.toLowerCase())
    .join("-");
}

export function buildIdentifier(id: string, ...additionalIds: string[]): string {
  if (!id || id.trim().length === 0) {
    throw new Error("ID must not be null or empty.");
  }
  const ids: string[] = [id];
  for (const additionalId of additionalIds) {
    if (additionalId && additionalId.trim().length !== 0) {
      ids.push(additionalId);
    }
  }
  return ids
    .map(asId)
    .filter((s): s is string => s !== null)
    .join("-");
}

export function fromTemplate(template: string): string {
  if (!template || template.length === 0) {
    return "root";
  }
  const safeTemplate = template
    .replaceAll("/", "-s-")
    .replaceAll("=", "-e-")
    .replaceAll(":", "-c-")
    .replaceAll("*", "-w-");
  return buildIdentifier(safeTemplate);
}

// ------------------------------------------------------ static identifiers

export const ADD_RESOURCE_STEP = "add-resource-step";
export const ALL_TASKS = "all-tasks";
export const ATTRIBUTES_HEAD = "attributes-head";
export const ATTRIBUTES_TAB = "resource-tabs-attributes";
export const BREADCRUMB_ROOT = "root";
export const CAPABILITIES_HEAD = "capabilities-head";
export const CAPABILITIES_TAB = "resource-tabs-capabilities";
export const CATALOG_THEAD = "catalog-head";
export const CLEAR_ALL = "clear-all";
export const CONFIG_FILE = "config-file";
export const CONFIGURATION_COLUMN = "configuration-column";
export const CONSOLE_VERSION = "console-version";
export const CREDENTIAL_STORE_ALIASES_TAB = "credential-store-aliases";
export const DATA_TAB = "resource-tabs-data";
export const ENDPOINT_EMPTY = "endpoint-empty";
export const ENDPOINT_HOST = "mi-host";
export const ENDPOINT_NAME = "mi-name";
export const ENDPOINT_PORT = "mi-port";
export const ENDPOINT_PROTOCOL = "mi-protocol";
export const ENDPOINT_THEAD = "endpoint-head";
export const ENDPOINT_URL = "mi-url";
export const EXPRESSIONS_HEAD = "expressions-head";
export const HOST_ARCH = "host-arch";
export const HOST_CORES = "host-cores";
export const HOST_NAME = "host-name";
export const INBOUND_ITEM = "inbound";
export const INTERFACE_COLUMN = "interface-column";
export const INTERFACES_ITEM = "interfaces-item";
export const JVM_NAME = "jvm-name";
export const JVM_VENDOR = "jvm-vendor";
export const JVM_VERSION = "jvm-version";
export const MARK_ALL_READ = "mark-all-read";
export const NAV_CONFIGURATION = "/configuration";
export const NAV_DASHBOARD = "/";
export const NAV_DEPLOYMENTS = "/deployments";
export const NAV_MODEL_BROWSER = "/model-browser";
export const NAV_MODEL_CATALOG = "/model-catalog";
export const NAV_RUNTIME = "/runtime";
export const NAV_TASKS = "/tasks";
export const NEW_EXPRESSION = "new-expression";
export const OPERATION_MODE = "operation-mode";
export const OPERATIONS_HEAD = "operations-head";
export const OPERATIONS_TAB = "resource-tabs-operations";
export const OUTBOUND_LOCAL_ITEM = "outbound-local";
export const OUTBOUND_REMOTE_ITEM = "outbound-remote";
export const PATH_COLUMN = "path-column";
export const PATHS_ITEM = "paths-item";
export const RESOURCES_HEAD = "resources-head";
export const RUNTIME_CONFIGURATION_STATE = "runtime-configuration-state";
export const SELECT_ALL = "select-all";
export const SELECT_FILTERED = "select-filtered";
export const SELECT_LOCATION_STEP = "select-location";
export const SELECT_NONE = "select-none";
export const SOCKET_BINDING_GROUP_COLUMN = "socket-binding-group-column";
export const SOCKET_BINDING_INBOUND = "socket-binding-inbound";
export const SOCKET_BINDING_OUTBOUND_LOCAL = "socket-binding-outbound-local";
export const SOCKET_BINDING_OUTBOUND_REMOTE = "socket-binding-outbound-remote";
export const SOCKET_BINDING_TYPE = "socket-binding-type";
export const SOCKET_BINDINGS_ITEM = "socket-bindings-item";
export const SUBSYSTEM_COLUMN = "subsystem-column";
export const SUBSYSTEMS_ITEM = "subsystems-item";
export const SYSTEM_PROPERTIES_ITEM = "system-properties-item";
export const SYSTEM_PROPERTY_COLUMN = "system-property-column";
export const UNCLEAR_LAST = "unclear-last";
