import type { Locator, Page } from "@playwright/test";
import {
  NAV_CONFIGURATION,
  NAV_DASHBOARD,
  NAV_DEPLOYMENTS,
  NAV_MODEL_BROWSER,
  NAV_RUNTIME,
  NAV_TASKS,
} from "@halconsole/ouia";
import { ouiaSelector } from "../utils/ouia.js";
import { BasePage, MAIN_CONTENT } from "./base.page.js";

const NAV_ITEMS = {
  Dashboard: NAV_DASHBOARD,
  Deployments: NAV_DEPLOYMENTS,
  Tasks: NAV_TASKS,
  Configuration: NAV_CONFIGURATION,
  Runtime: NAV_RUNTIME,
  "Management model": NAV_MODEL_BROWSER,
} as const;

export type NavItem = keyof typeof NAV_ITEMS;

const NAV_ITEM_NAMES = Object.keys(NAV_ITEMS) as NavItem[];

export class NavigationPage extends BasePage {
  constructor(page: Page, managementUrl: string) {
    super(page, managementUrl);
  }

  link(item: NavItem): Locator {
    return this.page.locator(ouiaSelector(NAV_ITEMS[item]));
  }

  async navigateTo(item: NavItem): Promise<void> {
    await this.link(item).click();
    await this.page.locator(MAIN_CONTENT).waitFor({ state: "visible" });
  }
}

export { NAV_ITEM_NAMES, NAV_ITEMS };
