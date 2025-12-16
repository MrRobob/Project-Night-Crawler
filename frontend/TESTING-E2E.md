# End-to-End-Tests mit Playwright

Dieses Frontend nutzt [Playwright](https://playwright.dev) für browserbasierte E2E-Tests. Die Konfiguration startet den Vite-Dev-Server automatisch und prüft den Landing-Flow, ohne dass ein Backend laufen muss.

## Installation

1. Stelle sicher, dass `node` und `npm` installiert sind.
2. Browser-Binärdateien installieren (einmalig):

   ```bash
   npx playwright install --with-deps
   ```

   Falls npm-Registry-Zugriffe durch einen Proxy blockiert werden, entferne die Proxy-Variablen temporär oder passe sie an.

3. Abhängigkeiten aktualisieren:

   ```bash
   npm install
   ```

## Ausführen

Standardlauf (headless):

```bash
npm run test:e2e
```

Nützliche Varianten:

- Headed (zum Debuggen): `npm run test:e2e:headed`
- Nur Report anzeigen (ohne erneuten Testlauf): `npm run test:e2e:report`
- Codegen-Recorder: `npm run test:e2e:codegen`

Die `playwright.config.js` startet automatisch `npm run dev -- --host --port 5173`. Setze `E2E_BASE_URL`, wenn du einen bereits laufenden Server wiederverwenden möchtest, oder `E2E_PORT`, um den Port zu ändern.

## Testaufbau

Aktuelle Tests liegen unter `tests/e2e/` und prüfen, dass die Landing-Page die primären CTA-Links und Feature-Blöcke rendert. Weitere Flows können analog hinzugefügt werden, z. B. Login oder Jobsuche mit API-Mocks.

### Tipps für neue Tests

- Greife über ARIA-Rollen (`getByRole`) und sichtbare Texte zu, um robuste Selektoren zu erhalten.
- Verwende `test.step` und Screenshots/Traces (`trace: 'on-first-retry'`) für bessere Fehlersuche.
- Für API-Mocks kann `page.route` genutzt werden, um Antworten für `/jobsuchen` oder Auth-Calls zu stürpen.
