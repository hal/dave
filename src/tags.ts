interface TagDefinition {
  readonly value: string;
  readonly description: string;
}

export const Tag = {
  SMOKE: { value: "@smoke", description: "Smoke tests" },
  DASHBOARD: { value: "@dashboard", description: "Dashboard feature" },
  NAVIGATION: { value: "@navigation", description: "Navigation feature" },
  MODEL_BROWSER: { value: "@model-browser", description: "Model browser feature" },
  CONFIGURATION: { value: "@configuration", description: "Configuration feature" },
  TASKS: { value: "@tasks", description: "Tasks feature" },
  CRUD: { value: "@crud", description: "CRUD operations" },
} as const satisfies Record<string, TagDefinition>;

export type TagValue = (typeof Tag)[keyof typeof Tag]["value"];
