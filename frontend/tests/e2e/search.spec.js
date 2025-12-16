import { test, expect } from "@playwright/test";

// Vorbefüllter Storage-State: simuliert eingeloggten User für /app-Routen.
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

// Jobsuche: Request-Body, Ergebnisliste, Bookmark-Toggle (alles gemockt).
test.describe("Jobsuche & Bookmark", () => {
  test.beforeEach(async ({ page }) => {
    const ctx = page.context();

    // Jobsuchen- und Bookmark-API stubben (Context-Ebene, greift auch bei Reloads)
    const jobs = [
      {
        _id: "job-1",
        title: "Fullstack Developer",
        company: "Acme Inc",
        link: "https://example.com/job-1",
        bookmark: false,
      },
      {
        _id: "job-2",
        title: "Frontend Engineer",
        company: "Globex",
        link: "https://example.com/job-2",
        bookmark: false,
      },
    ];

    const searchBodies = [];
    const bookmarkBodies = [];

    await ctx.route("**/jobsuchen", (route) => {
      const req = route.request();
      if (req.method() === "POST") {
        searchBodies.push(req.postDataJSON());
        route.fulfill({
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "content-type": "application/json",
          },
          body: JSON.stringify(jobs),
        });
      } else {
        route.fulfill({
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "content-type": "application/json",
          },
          body: "[]",
        });
      }
    });

    await ctx.route("**/update_bookmark", (route) => {
      bookmarkBodies.push(route.request().postDataJSON());
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: "{}",
      });
    });

    await page.goto("/app");

    // Eingaben: Keyword, Standort, Radius, dann Suche starten
    await page.getByPlaceholder("Neuen Suchbegriff eingeben").fill("Node.js");
    await page.getByRole("button", { name: /\+ Suchbegriff/i }).click();
    await page.getByPlaceholder("Standort eingeben").fill("Berlin");
    await page.locator("select#radius").selectOption("50");
    await page.getByRole("button", { name: /jobs finden/i }).click();

    // Ergebnisse erscheinen
    await expect(page.getByText("Fullstack Developer")).toBeVisible();
    await expect(page.getByText("Frontend Engineer")).toBeVisible();

    // Request-Body prüfen
    expect(searchBodies).toHaveLength(1);
    expect(searchBodies[0]).toEqual({
      keywords: ["Node.js"],
      location: "Berlin",
      radius: "50",
    });

    // Bookmark toggle: erst speichern, dann wieder entfernen
    const firstBookmark = page
      .getByRole("button", { name: /lesezeichen speichern/i })
      .first();
    await expect(firstBookmark).toHaveAttribute("aria-pressed", "false");
    await firstBookmark.click();
    await expect(firstBookmark).toHaveAttribute("aria-pressed", "true");

    // Request für Bookmark wurde abgesetzt
    expect(bookmarkBodies[0]).toEqual({
      _id: "job-1",
      bookmark: true,
    });
  });
});
