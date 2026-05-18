import type { Locator, Page } from "@playwright/test";

const MODAL_NAME = "Connect to WildFly";

export class EndpointPage {
  readonly modal: Locator;

  constructor(readonly page: Page) {
    this.modal = page.getByRole("dialog", { name: MODAL_NAME });
  }

  async isModalVisible(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
