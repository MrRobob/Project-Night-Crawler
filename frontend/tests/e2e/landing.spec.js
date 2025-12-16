import { test, expect } from "@playwright/test";

// Smoke: Landing-CTAs sichtbar und korrekt verlinkt; drei Feature-Headings vorhanden.
test.describe("Landing page", () => {
  test("shows hero call-to-actions and feature copy", async ({ page }) => {
    await page.goto("/");

    const startLink = page.getByRole("link", { name: "Jetzt starten" });
    const appLink = page.getByRole("link", { name: "Zur App" });

    // Haupt-CTAs: sichtbar und verlinken auf Register/App
    await expect(startLink).toBeVisible();
    await expect(startLink).toHaveAttribute("href", "/register");

    await expect(appLink).toBeVisible();
    await expect(appLink).toHaveAttribute("href", "/app");

    // Drei Feature-Titel auf der Seite
    await expect(
      page.getByRole("heading", { name: /schneller suchen/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /merken mit nur einem klick/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /immer aktuell/i }),
    ).toBeVisible();

    // H3-Überschriften sollten genau dreimal vorhanden sein
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
  });
});
