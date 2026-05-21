/** Builds a CSS attribute selector for the given OUIA component ID. */
export function ouiaSelector(id: string): string {
  return `[data-ouia-component-id="${id}"]`;
}
