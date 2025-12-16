import { test, expect } from "@playwright/test";

// Dauerhaftes Fake-JWT mit gueltigem exp in ferner Zukunft,
// damit initAutoLogout nicht die Tokens loescht.
const TEST_ACCESS =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiIjo0MTAyNDQ0ODAwfQ.dummy";

// Navigation: Sidebar-Routen wechseln korrekt; Logo führt zur Landing Page.
test.use({
  storageState: {
    origins: [
      {
        origin: "http://localhost:5173",
        localStorage: [
          { name: "access", value: TEST_ACCESS },
          { name: "refresh", value: "e2e-refresh" },
          { name: "auth_email", value: "e2e@example.com" },
        ],
      },
      {
        origin: "http://127.0.0.1:5173",
        localStorage: [
          { name: "access", value: TEST_ACCESS },
          { name: "refresh", value: "e2e-refresh" },
          { name: "auth_email", value: "e2e@example.com" },
        ],
      },
    ],
  },
});

test.describe("Navigation & Routing", () => {
  test.beforeEach(async ({ page }) => {
    const ctx = page.context();

    // Mocks VOR irgendeinem goto registrieren (auf Context-Ebene, damit auch Reloads abgefangen werden)
    await ctx.route("**/auth/login", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify({ access: TEST_ACCESS, refresh: "e2e-refresh" }),
      }),
    );
    await ctx.route("**/jobsuchen", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "[]",
      }),
    );
    await ctx.route("**/update_bookmark", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );

    // Token direkt setzen, dann App laden (keine UI-Interaktion nötig)
    await page.addInitScript(({ token }) => {
      localStorage.setItem("access", token);
      localStorage.setItem("refresh", "e2e-refresh");
      localStorage.setItem("auth_email", "e2e@example.com");
    }, { token: TEST_ACCESS });

    await page.goto("/app");
  });

  test("sidebar buttons navigate between app sections", async ({ page }) => {
    // Sidebar-Reiter springen durch die App-Abschnitte
    await expect(page).toHaveURL(/\/app$/);

    await page.getByRole("button", { name: "Lesezeichen" }).click();
    await expect(page).toHaveURL(/\/bookmarked$/);

    await page.getByRole("button", { name: /suchauftr/i }).click();
    await expect(page).toHaveURL(/\/search_alerts$/);

    // Browser-History funktioniert erwartungsgemäß
    await page.goBack();
    await expect(page).toHaveURL(/\/bookmarked$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/search_alerts$/);
  });

  test("logo link führt zur Landing Page", async ({ page }) => {
    await page.goto("/app");

    // Logo im Header sollte immer auf Home verlinken
    await page.getByRole("link", { name: "Night Crawler" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
