import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero call-to-actions and feature copy", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Jetzt starten" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Zur App" })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /schneller suchen/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /merken mit nur einem klick/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /immer aktuell/i }),
    ).toBeVisible();
  });
});
