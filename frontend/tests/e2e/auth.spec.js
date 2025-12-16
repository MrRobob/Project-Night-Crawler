import { test, expect } from "@playwright/test";

// Auth-Flows: Login (Erfolg/Fehler) und Registrierung, jeweils mit API-Mocks.
test.describe("Auth flows", () => {
  test("login success navigates to /app", async ({ page }) => {
    let loginBody = null;

    await page.route("**/auth/login", (route) => {
      loginBody = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        body: JSON.stringify({ access: "token", refresh: "refresh-token" }),
      });
    });
    await page.route("**/jobsuchen", (route) =>
      route.fulfill({ status: 200, body: "[]" }),
    );

    await page.goto("/login");
    await page.getByPlaceholder("E-Mail").fill("user@example.com");
    await page.getByPlaceholder("Passwort").fill("secret123");
    await page.getByRole("button", { name: /einloggen/i }).click();

    await expect(page).toHaveURL(/\/app$/);
    expect(loginBody).toEqual({
      email: "user@example.com",
      password: "secret123",
    });
  });

  test("login error shows message and stays on /login", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      }),
    );

    await page.goto("/login");
    await page.getByPlaceholder("E-Mail").fill("user@example.com");
    await page.getByPlaceholder("Passwort").fill("wrong");
    await page.getByRole("button", { name: /einloggen/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/invalid|fehlgeschlagen/i)).toBeVisible();
  });

  test("register success shows confirmation", async ({ page }) => {
    let registerBody = null;

    await page.route("**/auth/register", (route) => {
      registerBody = route.request().postDataJSON();
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/register");
    await page.getByPlaceholder("E-Mail").fill("new@example.com");
    await page.getByPlaceholder("Passwort").fill("secret123");
    await page.getByRole("button", { name: /konto anlegen/i }).click();

    await expect(page.getByText(/registriert/i)).toBeVisible();
    expect(registerBody).toEqual({
      email: "new@example.com",
      password: "secret123",
    });
  });
});
