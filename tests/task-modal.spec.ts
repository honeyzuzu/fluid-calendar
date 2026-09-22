import { expect, test } from "@playwright/test";

test("new task capture stays short until more details are requested", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/task-modal");

  const dialog = page.getByRole("dialog");
  const title = page.getByLabel("What needs doing?");
  await expect(dialog).toBeVisible();
  await expect(title).toBeFocused();
  await expect(page.getByLabel("Notes")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create task" })).toBeVisible();

  const keepOpen = page.getByText("Keep this open for another");
  const cancel = page.getByRole("button", { name: "Cancel" });
  const keepOpenBox = await keepOpen.boundingBox();
  const cancelBox = await cancel.boundingBox();
  expect(keepOpenBox?.y).toBeLessThan(cancelBox?.y ?? 0);

  await page.getByRole("button", { name: "More details" }).click();
  await expect(page.getByLabel("Notes")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Project" })).toBeVisible();
});

test("create-another keeps the capture dialog ready for the next task", async ({
  page,
}) => {
  await page.goto("/preview/task-modal");
  const title = page.getByLabel("What needs doing?");

  await title.fill("Call the dentist");
  await page
    .getByRole("checkbox", { name: "Keep this open for another" })
    .click();
  await page.getByRole("button", { name: "Create & continue" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(title).toHaveValue("");
  await expect(title).toBeFocused();
});
