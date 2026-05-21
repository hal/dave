// Generated from Ids.java — do not edit. Run pnpm sync:ouia to regenerate.

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

export function buildId(id: string, ...additionalIds: string[]): string {
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

// ------------------------------------------------------ static IDs

export const BOOTSTRAP_SELECT_BTN = "hal-op-bootstrap-select-btn";
export const COOKIE = "hal-cookie";
export const ENDPOINT_ADD_BTN = "hal-op-endpoint-add-btn";
export const ENDPOINT_CANCEL_BTN = "hal-op-endpoint-cancel-btn";
export const ENDPOINT_CONNECT_BTN = "hal-op-endpoint-connect-btn";
export const ENDPOINT_MODAL = "hal-op-endpoint-modal";
export const ENDPOINT_PING_BTN = "hal-op-endpoint-ping-btn";
export const ENDPOINT_SELECT_BTN = "hal-op-endpoint-select-btn";
export const ENDPOINT_TABLE_ADD_BTN = "hal-op-endpoint-table-add-btn";
export const EXPRESSION_CANCEL_BTN = "hal-op-expression-cancel-btn";
export const EXPRESSION_MODAL = "hal-op-expression-modal";
export const EXPRESSION_OK_BTN = "hal-op-expression-ok-btn";
export const FIND_RESOURCE_CANCEL_BTN = "hal-op-find-resource-cancel-btn";
export const FIND_RESOURCE_MODAL = "hal-op-find-resource-modal";
export const FIND_RESOURCE_SEARCH_BTN = "hal-op-find-resource-search-btn";
export const LOG_CHOOSE_BTN = "hal-op-log-choose-btn";
export const LOG_SHOW_BTN = "hal-op-log-show-btn";
export const MAIN_ID = "hal-main-id";
export const MASTHEAD = "hal-op-masthead";
export const MASTHEAD_LOGO = "hal-op-masthead-logo";
export const MASTHEAD_TOOLBAR = "hal-op-masthead-toolbar";
export const MODEL_BROWSER_BACK_BTN = "hal-op-model-browser-back-btn";
export const MODEL_BROWSER_COLLAPSE_BTN = "hal-op-model-browser-collapse-btn";
export const MODEL_BROWSER_FIND_BTN = "hal-op-model-browser-find-btn";
export const MODEL_BROWSER_FORWARD_BTN = "hal-op-model-browser-forward-btn";
export const MODEL_BROWSER_HOME_BTN = "hal-op-model-browser-home-btn";
export const MODEL_BROWSER_REFRESH_BTN = "hal-op-model-browser-refresh-btn";
export const NAV = "hal-op-nav";
export const NAV_CONFIGURATION = "hal-op-nav-configuration";
export const NAV_DASHBOARD = "hal-op-nav-dashboard";
export const NAV_DEPLOYMENTS = "hal-op-nav-deployments";
export const NAV_MODEL_BROWSER = "hal-op-nav-model-browser";
export const NAV_RUNTIME = "hal-op-nav-runtime";
export const NAV_TASKS = "hal-op-nav-tasks";
export const NOTIFICATION_CLEAR_ALL = "hal-op-notification-clear-all";
export const NOTIFICATION_MARK_ALL_READ = "hal-op-notification-mark-all-read";
export const NOTIFICATION_UNCLEAR_LAST = "hal-op-notification-unclear-last";
export const PAGE_CONFIGURATION = "hal-op-page-configuration";
export const PAGE_DASHBOARD = "hal-op-page-dashboard";
export const PAGE_DASHBOARD_HEADER = "hal-op-page-dashboard-header";
export const PAGE_DEPLOYMENTS = "hal-op-page-deployments";
export const PAGE_ERROR = "hal-op-page-error";
export const PAGE_MODEL_BROWSER = "hal-op-page-model-browser";
export const PAGE_NO_DATA = "hal-op-page-no-data";
export const PAGE_NOT_FOUND = "hal-op-page-not-found";
export const PAGE_RUNTIME = "hal-op-page-runtime";
export const PAGE_TASKS = "hal-op-page-tasks";
export const PAGE_TASKS_HEADER = "hal-op-page-tasks-header";
export const STABILITY_DISMISS_BTN = "hal-op-stability-dismiss-btn";
export const STANDALONE_HOST = "hal-standalone-host";
export const STANDALONE_SERVER = "hal-standalone-server";

// ------------------------------------------------------ dynamic IDs

export function hostServer(host: string, server: string): string {
  return buildId(host, server);
}

export function ouia(first: string, ...rest: string[]): string {
  return buildId("hal-op", first, ...rest);
}
