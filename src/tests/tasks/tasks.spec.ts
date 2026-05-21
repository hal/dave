import { test, expect } from "../../fixtures/pages.fixture.js";
import { TASK_NAMES } from "../../pages/tasks.page.js";
import { Tag } from "../../tags.js";

test.use({ specPath: "tasks/tasks" });

test.describe("Tasks", { tag: [Tag.TASKS] }, () => {
  test("shows tasks heading", async ({ tasksPage }) => {
    await expect(tasksPage.heading).toBeVisible();
    await expect(tasksPage.heading).toHaveText("Tasks");
  });

  test("shows task cards", async ({ tasksPage }) => {
    for (const name of TASK_NAMES) {
      await expect(tasksPage.taskCard(name)).toBeVisible();
    }
  });

  test("shows launch buttons", async ({ tasksPage }) => {
    for (const name of TASK_NAMES) {
      const card = tasksPage.taskCard(name);
      const section = card.locator("..");
      await expect(section.getByRole("button", { name: "Launch" })).toBeVisible();
    }
  });
});
