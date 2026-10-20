/** Builds a CSS attribute selector for the given component identifier. */
export function identifierSelector(id: string): string {
  return `[data-identifier="${id}"]`;
}
