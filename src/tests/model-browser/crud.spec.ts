import { test, expect } from "../../fixtures/pages.fixture.js";
import { readAttribute, resourceExists } from "../../utils/dmr.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "model-browser/crud" });

test.describe.serial("Model Browser CRUD", { tag: [Tag.MODEL_BROWSER.value, Tag.CRUD.value] }, () => {
  test("creates a system property", async ({ modelBrowserPage, wildfly }) => {
    await modelBrowserPage.selectTreeItem("system-property");
    await expect(modelBrowserPage.noChildResources()).toBeVisible();

    await modelBrowserPage.addChildResource({ Name: "foo", Value: "bar" });

    await expect(modelBrowserPage.successAlert()).toBeVisible();
    await expect(modelBrowserPage.childResourceText("foo")).toBeVisible();

    const value = await readAttribute(wildfly.managementUrl, ["system-property", "foo"], "value");
    expect(value).toBe("bar");
  });

  test("reads system property attributes", async ({ modelBrowserPage }) => {
    await modelBrowserPage.selectTreeItem("system-property");
    await modelBrowserPage.viewButton("foo").click();

    await expect(modelBrowserPage.resourceHeading).toHaveText("foo");
    const breadcrumbText = await modelBrowserPage.breadcrumbText();
    expect(breadcrumbText).toContain("system-property=foo");

    await expect(modelBrowserPage.tabPanel("Data").getByText("bar")).toBeVisible();
  });

  test("updates system property value", async ({ modelBrowserPage, wildfly }) => {
    await modelBrowserPage.selectTreeItem("system-property");
    await modelBrowserPage.viewButton("foo").click();
    await expect(modelBrowserPage.resourceHeading).toHaveText("foo");

    await modelBrowserPage.editButton().click();
    await expect(modelBrowserPage.saveButton()).toBeVisible();

    const input = modelBrowserPage.dataAttributeInput("Value");
    await input.clear();
    await input.fill("changed");
    await modelBrowserPage.saveButton().click();

    await expect(modelBrowserPage.successAlert()).toBeVisible();
    await expect(modelBrowserPage.tabPanel("Data").getByText("changed")).toBeVisible();

    const value = await readAttribute(wildfly.managementUrl, ["system-property", "foo"], "value");
    expect(value).toBe("changed");
  });

  test("deletes system property", async ({ modelBrowserPage, wildfly }) => {
    await modelBrowserPage.selectTreeItem("system-property");
    await expect(modelBrowserPage.childResourceText("foo")).toBeVisible();

    await modelBrowserPage.removeChildResource("foo");

    await expect(modelBrowserPage.successAlert()).toBeVisible();
    await expect(modelBrowserPage.noChildResources()).toBeVisible();

    const exists = await resourceExists(wildfly.managementUrl, ["system-property", "foo"]);
    expect(exists).toBe(false);
  });
});
