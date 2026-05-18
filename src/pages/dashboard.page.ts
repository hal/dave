import type { Locator, Page } from "@playwright/test";

const HEADING_TEXT = "WildFly Application Server";

export class DashboardPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: HEADING_TEXT });
  }

  async isLoaded(): Promise<boolean> {
    return this.heading.isVisible();
  }
}
