import { expect, test } from "@playwright/test";

test("Daily Rise completes its focused four-step flow", async ({ page }) => {
  await page.goto("/preview/daily-rise");
  await expect(
    page.getByRole("heading", { name: "Good morning, sunshine." })
  ).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(
    page.getByRole("heading", { name: "What would make today meaningful?" })
  ).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(
    page.getByRole("heading", { name: "Keep today small enough to hold." })
  ).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(
    page.getByRole("heading", { name: "Make room for the plan." })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start my day" })
  ).toBeVisible();
});

test("Daily Unwind requires a home for unfinished work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/daily-unwind");
  await expect(page.getByText("Design catch-up")).toBeVisible();
  await expect(page.getByText("Lunch with Maya")).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(
    page.getByRole("button", { name: /place 1 task/i })
  ).toBeDisabled();
  await page.getByRole("button", { name: "Tomorrow" }).click();
  await expect(page.getByText("Everything has a home.")).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(
    page.getByRole("heading", { name: "How did today feel?" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close the day" })
  ).toBeVisible();
});
