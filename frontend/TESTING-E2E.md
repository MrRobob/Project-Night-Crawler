# End-to-End-Tests mit Playwright

Dieses Frontend nutzt [Playwright](https://playwright.dev) fuer browserbasierte E2E-Tests. Die Konfiguration startet den Vite-Dev-Server automatisch und prueft den Landing-Flow, ohne dass ein Backend laufen muss.

## Installation

1. Stelle sicher, dass `node` und `npm` installiert sind.
2. Browser-Binaerdateien installieren (einmalig):

   ```bash
   npx playwright install --with-deps
   ```

   Falls npm-Registry-Zugriffe durch einen Proxy blockiert werden, entferne die Proxy-Variablen temporaer oder passe sie an.

3. Abhaengigkeiten aktualisieren:

   ```bash
   npm install
   ```

## Ausfuehren

Standardlauf (headless):

```bash
npm run test:e2e
```

Nuetzliche Varianten:

- Headed (zum Debuggen): `npm run test:e2e:headed`
- Nur Report anzeigen (ohne erneuten Testlauf): `npm run test:e2e:report`
- Codegen-Recorder: `npm run test:e2e:codegen`

Die `playwright.config.js` startet automatisch `npm run dev -- --host --port 5173`. Setze `E2E_BASE_URL`, wenn du einen bereits laufenden Server wiederverwenden moechtest, oder `E2E_PORT`, um den Port zu aendern.

## Testaufbau

Aktuelle Tests liegen unter `tests/e2e/` und pruefen, dass die Landing-Page die primaeren CTA-Links und Feature-Bloecke rendert. Weitere Flows koennen analog hinzugefuegt werden, z. B. Login oder Jobsuche.

Aktuelle Specs (kurz):

- `landing.spec.js`: Smoke fuer Landing (CTAs sichtbar + Hrefs, drei Feature-Headings).
- `navigation.spec.js`: Sidebar-Navigation zwischen App-Routen, Logo-Link zur Landing Page.
- `auth.spec.js`: Login Erfolg/Fehler (mit Mocks) und Registrierung.
- `search.spec.js`: Jobsuche (Request-Body, Ergebnisliste) und Bookmark-Toggle (Mock).
- `forms.spec.js`: Formulare/Validierung (Jobsuche: Pflichtfeld/Loading; Reset-Links/Passwort-Reset: Erfolg/Fehler).

### So liest du die Playwright-Tests (Kurzfassung)

- Selektoren: `getByRole` + sichtbarer Text/Label bevorzugen; `getByLabel` fuer Formfelder. `data-testid` nur, wenn ARIA/Labels nicht reichen.
- Erwartungen: `expect(...).toBeVisible()` fuer Sichtbarkeit, `toHaveURL`/`toHaveAttribute` fuer Navigation/Links.
- Mocks: `page.route("**/api/...", route => route.fulfill({ status: 200, body: "[]" }))` verhindert echte Backend-Calls.
- Auth-Stubs: `page.addInitScript(() => localStorage.setItem("access", "..."))` setzt Tokens vor dem ersten Request (siehe `navigation.spec.js`).
- Kommentare: Kurz notieren, warum der Check existiert (Ziel), nicht was Syntax macht.

### Tipps fuer neue Tests

- Greife ueber ARIA-Rollen (`getByRole`) und sichtbare Texte zu, um robuste Selektoren zu erhalten.
- Verwende `test.step` und Screenshots/Traces (`trace: 'on-first-retry'`) fuer bessere Fehlersuche.
- Fuer API-Mocks kann `page.route` genutzt werden, um Antworten fuer `/jobsuchen` oder Auth-Calls zu stubben.
