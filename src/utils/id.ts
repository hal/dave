/**
 * Port of Elemento's org.jboss.elemento.Id — sanitises and joins segments into
 * a hyphen-separated, lowercase identifier string.
 *
 * Used by hal/foundation's Identifiers.build() and Identifiers.fromTemplate()
 * to produce dynamic data-identifier values at runtime.
 */

function asId(text: string): string | null {
  const parts = text.split(/[-\s]/);
  const sanitized: string[] = [];
  for (const part of parts) {
    let s = part.replace(/\s+/g, "");
    s = s.replace(/[^a-zA-Z0-9\-_]/g, "");
    s = s.replace(/_/g, "-");
    if (s.length > 0) {
      sanitized.push(s);
    }
  }
  const filtered = sanitized.filter((s) => s.trim().length > 0);
  if (filtered.length === 0) {
    return null;
  }
  return filtered.map((s) => s.toLowerCase()).join("-");
}

/** Joins one or more segments into a sanitised, hyphen-separated, lowercase identifier. */
export function buildId(id: string, ...additionalIds: string[]): string {
  if (!id || id.trim().length === 0) {
    throw new Error("ID must not be null or empty.");
  }
  const ids = [id];
  for (const additionalId of additionalIds) {
    if (additionalId && additionalId.trim().length > 0) {
      ids.push(additionalId);
    }
  }
  return ids
    .map(asId)
    .filter((s): s is string => s !== null)
    .join("-");
}

/**
 * Produces an identifier from a WildFly address template string.
 * Replaces special characters (/, =, :, *) with safe delimiters
 * before passing through buildId().
 */
export function idFromTemplate(template: string): string {
  if (!template || template.length === 0) {
    return "root";
  }
  const safeTemplate = template.replace(/\//g, "-s-").replace(/=/g, "-e-").replace(/:/g, "-c-").replace(/\*/g, "-w-");
  return buildId(safeTemplate);
}
