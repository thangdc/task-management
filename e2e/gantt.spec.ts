import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "task-management.tasks.v1";

async function readTask(page: Page, id: string) {
  return page.evaluate(({ key, taskId }) => {
    const tasks = JSON.parse(localStorage.getItem(key) ?? "[]");
    return tasks.find((task: { id: string }) => task.id === taskId);
  }, { key: STORAGE_KEY, taskId: id });
}

async function dragLocator(page: Page, selector: string, deltaX: number) {
  const target = page.locator(selector).first();
  await expect(target).toBeVisible();
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) throw new Error(`No bounding box for ${selector}`);
  const x = selector.endsWith(".bar") ? bounds.x + 8 : bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + deltaX, y, { steps: 10 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: /Gantt timeline/ }).click();
  await expect(page.locator(".gantt .bar-wrapper")).toHaveCount(5);
});

test("moving a task bar updates dates, persists, and does not open the editor", async ({ page }) => {
  const before = await readTask(page, "task-2");
  await dragLocator(page, '.bar-wrapper[data-id="task-2"] .bar', 52);

  await expect.poll(async () => (await readTask(page, "task-2"))?.startDate).not.toBe(before.startDate);
  const moved = await readTask(page, "task-2");
  expect(moved.dueDate).not.toBe(before.dueDate);
  await expect(page.locator(".task-editor")).toBeHidden();

  await page.reload();
  await page.getByRole("button", { name: /Gantt timeline/ }).click();
  await expect.poll(async () => (await readTask(page, "task-2"))?.startDate).toBe(moved.startDate);
  await expect.poll(async () => (await readTask(page, "task-2"))?.dueDate).toBe(moved.dueDate);
});

test("resizing the left and right handles changes the matching date boundaries", async ({ page }) => {
  const initial = await readTask(page, "task-2");

  await dragLocator(page, '.bar-wrapper[data-id="task-2"] .handle.left', 52);
  await expect.poll(async () => (await readTask(page, "task-2"))?.startDate).not.toBe(initial.startDate);
  const afterLeft = await readTask(page, "task-2");
  expect(afterLeft.dueDate).toBe(initial.dueDate);

  await dragLocator(page, '.bar-wrapper[data-id="task-2"] .handle.right', 52);
  await expect.poll(async () => (await readTask(page, "task-2"))?.dueDate).not.toBe(afterLeft.dueDate);
  await expect(page.locator(".task-editor")).toBeHidden();
});

test("a normal click on a task bar still opens its editor", async ({ page }) => {
  await page.locator('.bar-wrapper[data-id="task-2"] .bar').click({ position: { x: 8, y: 15 } });
  await expect(page.locator(".task-editor")).toBeVisible();
});
