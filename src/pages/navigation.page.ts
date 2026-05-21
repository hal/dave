import type { Locator } from "@playwright/test";
import {
  MAIN_ID,
  NAV_CONFIGURATION,
  NAV_DASHBOARD,
  NAV_DEPLOYMENTS,
  NAV_MODEL_BROWSER,
  NAV_RUNTIME,
  NAV_TASKS,
} from "@halconsole/ouia";
import { BasePage } from "./base.page.js";
import { ouiaSelector } from "../utils/ouia.js";

const NAV_ITEMS = {
  Dashboard: NAV_DASHBOARD,
  Deployments: NAV_DEPLOYMENTS,
  Tasks: NAV_TASKS,
  Configuration: NAV_CONFIGURATION,
  Runtime: NAV_RUNTIME,
  "Management model": NAV_MODEL_BROWSER,
} as const;

export type NavItem = keyof typeof NAV_ITEMS;

export const NAV_ITEM_NAMES = Object.keys(NAV_ITEMS) as NavItem[];

/** Sidebar navigation page object — locates and clicks nav links by OUIA ID. */
export class NavigationPage extends BasePage {
  link(item: NavItem): Locator {
    return this.page.locator(ouiaSelector(NAV_ITEMS[item]));
  }

  async navigateTo(item: NavItem): Promise<void> {
    await this.link(item).click();
    await this.page.locator(`#${MAIN_ID}`).waitFor({ state: "visible" });
  }
}
