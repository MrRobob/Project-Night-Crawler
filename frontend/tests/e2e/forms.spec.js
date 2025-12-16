import { test, expect } from "@playwright/test";

// Dauerhaftes Fake-JWT mit gueltigem exp in ferner Zukunft,
// damit initAutoLogout nicht die Tokens loescht.
const TEST_ACCESS =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiIjo0MTAyNDQ0ODAwfQ.dummy";

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

// Formulare: Pflichtfelder, Loading, Erfolg/Fehler-Messages (alles gemockt).
test.describe("Formulare & Validierung", () => {
  test.beforeEach(async ({ page }) => {
    const ctx = page.context();

    // Routen VOR erstem goto mocken, damit initiale Requests abgefangen werden
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
    await ctx.route("**/auth/request-password-reset", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );
    await ctx.route("**/auth/reset-password", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );

    // Token direkt setzen, dann App laden (kein UI-Login nötig)
    await page.addInitScript(({ token }) => {
      localStorage.setItem("access", token);
      localStorage.setItem("refresh", "e2e-refresh");
      localStorage.setItem("auth_email", "e2e@example.com");
    }, { token: TEST_ACCESS });

    await page.goto("/app");
  });

  test("jobsuche erfordert Standort; ohne Standort kein Request", async ({
    page,
  }) => {
    let called = false;
    await page.route("**/jobsuchen", (route) => {
      called = true;
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "[]",
      });
    });

    await page.goto("/app");
    await page.getByRole("button", { name: /jobs finden/i }).click();
    await page.waitForTimeout(200); // kurze Pause, falls Submission doch laeuft
    expect(called).toBe(false);
  });

  test("jobsuche zeigt Loading und rendert Ergebnisse nach Response", async ({
    page,
  }) => {
    await page.route("**/jobsuchen", async (route) => {
      await new Promise((r) => setTimeout(r, 300)); // Loading sichtbar lassen
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify([
          {
            _id: "job-1",
            title: "Backend Developer",
            company: "Acme",
            link: "https://example.com/job-1",
            bookmark: false,
          },
        ]),
      });
    });

    await page.goto("/app");
    await page.getByPlaceholder("Neuen Suchbegriff eingeben").fill("API");
    await page.getByRole("button", { name: /\+ Suchbegriff/i }).click();
    await page.getByPlaceholder("Standort eingeben").fill("Hamburg");
    await page.getByRole("button", { name: /jobs finden/i }).click();

    // Loading-Indicator sichtbar, waehrend Response laeuft
    await expect(page.getByText(/ldt/i)).toBeVisible();

    // Nach Response: Ergebnis erscheint, Loading verschwindet
    await expect(page.getByText("Backend Developer")).toBeVisible();
    await expect(page.getByText(/ldt/i)).not.toBeVisible();
  });

  test("passwort-reset-link anfordern zeigt Bestaetigung", async ({ page }) => {
    let body = null;
    await page.route("**/auth/request-password-reset", (route) => {
      body = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "{}",
      });
    });

    await page.goto("/request-reset");
    await page.getByPlaceholder("E-Mail").fill("user@example.com");
    await page.getByRole("button", { name: /link senden/i }).click();

    await expect(page.getByText(/wenn die e-mail existiert/i)).toBeVisible();
    expect(body).toEqual({ email: "user@example.com" });
  });

  test("neues passwort: success und error message", async ({ page }) => {
    await page.route("**/auth/reset-password", (route) => {
      const ok = route.request().postDataJSON()?.token === "good";
      route.fulfill({
        status: ok ? 200 : 400,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });
    });

    // Erfolgspfad
    await page.goto("/reset-password?token=good");
    await page.getByPlaceholder("Neues Passwort").fill("secret123");
    await page.getByRole("button", { name: /speichern/i }).click();
    await expect(page.getByText(/passwort gesetzt/i)).toBeVisible();

    // Fehlerpfad
    await page.goto("/reset-password?token=bad");
    await page.getByPlaceholder("Neues Passwort").fill("secret456");
    await page.getByRole("button", { name: /speichern/i }).click();
    await expect(page.getByText(/ung/i)).toBeVisible();
  });
});
