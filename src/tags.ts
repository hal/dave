export const Tag = {
  SMOKE: "@smoke",
  DASHBOARD: "@dashboard",
  NAVIGATION: "@navigation",
  MODEL_BROWSER: "@model-browser",
} as const;

export type TagValue = (typeof Tag)[keyof typeof Tag];
