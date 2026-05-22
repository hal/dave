import { test, expect } from "../../fixtures/pages.fixture.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "smoke/dashboard" });

test.describe("Dashboard", { tag: [Tag.SMOKE.value, Tag.DASHBOARD.value] }, () => {
  test("shows dashboard heading", async ({ dashboardPage }) => {
    await expect(dashboardPage.heading).toBeVisible();
  });

  test("shows overview card with server info", async ({ dashboardPage }) => {
    await expect(dashboardPage.overviewSection).toBeVisible();
    await expect(dashboardPage.page.getByText("WildFly", { exact: true }).first()).toBeVisible();
    await expect(dashboardPage.page.getByText("RUNNING", { exact: true }).first()).toBeVisible();
  });

  test("shows host and JVM info", async ({ dashboardPage }) => {
    await expect(dashboardPage.hostSection).toBeVisible();
    await expect(dashboardPage.jvmSection).toBeVisible();
  });

  test("shows memory and threads charts", async ({ dashboardPage }) => {
    await expect(dashboardPage.memorySection).toBeVisible();
    await expect(dashboardPage.page.getByRole("img", { name: /heap memory/i })).toBeVisible();
    await expect(dashboardPage.page.getByRole("img", { name: /threads/i })).toBeVisible();
  });

  test("shows log card", async ({ dashboardPage }) => {
    await expect(dashboardPage.logSection).toBeVisible();
    await expect(dashboardPage.showLogButton).toBeVisible();
  });

  test("shows resource links", async ({ dashboardPage }) => {
    await expect(dashboardPage.generalResources).toBeVisible();
    await expect(dashboardPage.getHelp).toBeVisible();
  });
});
