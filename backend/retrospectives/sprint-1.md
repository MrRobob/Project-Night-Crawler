📄 
retrospectives/sprint-1.md
# 🌀 Sprint-Retrospektive – Sprint 1 (16.–23. Juni 2025)

**Projekt:** Project-Night-Crawler  
**Sprint-Zeitraum:** 16.06.–20.06.2025  
**Teilnehmende:** Bahram, Roman, Margarethe  
**Sprint-Ziel:** Grundstruktur aufbauen, funktionale API-Schnittstellen, Scraper-Fehler beheben, Projektstart dokumentieren und automatisieren

---

## ✅ What went well (Was lief gut?)

- Projekt wurde vollständig initialisiert (Backend, Frontend, .env, DB)
- API-Anbindung an die Arbeitsagentur erfolgreich umgesetzt
- Scraper funktioniert wieder, trotz vorherigem Timeout-Fehler
- GitHub Projects & Issues werden aktiv genutzt (Board, Labels, Status)
- README.md für Backend wurde sauber dokumentiert
- Zusammenarbeit im Team intensiv, lösungsorientiert und unterstützend
- Eigenverantwortung stark gelebt 

---

## ❌ What could have gone better (Was lief nicht gut?)

- `docker-ci.yml` hat Builds blockiert (Fehler in Automatisierung)
- Wichtige Branches (`api-arbeitsagentur`, `cleanup`) wurden noch nicht in Main gemerged → fehlersuche
- Fehlerhafte Angaben in der README.md führten zu Problemen bei der Initialisierung
- Unsicherheit bei der Nutzung von Git (z. B. Branch vs. Main vs. Pull Request)
- Zusammenarbeit mit GitHub CI/CD (z. B. Rechte, Logs, Workflow-Files) noch nicht voll verstanden

---

## 🎯 Lessons learned

- Fehler in Automatisierung können Entwicklung blockieren → vorher lokal testen
- README muss **aus Sicht eines Außenstehenden** geschrieben werden
- Branch-Struktur & Pull Requests besser vorab abstimmen
- Wenn man denkt „Ich kann nicht mehr“, ist man oft kurz vor dem Durchbruch

---

## 🚀 Opportunities & Ideen

- GitHub Actions nur für `main` aktivieren, nicht für alle Branches
- Templates für Retrospektiven, Issues und Pull Requests einführen
- Übersicht der Branches und ihren Stand dokumentieren
- Projektstruktur (.env, `venv`, Startbefehle etc.) als Setup-Script automatisieren
- `retrospectives/`-Ordner dauerhaft für Scrum verwenden

---

## 🛠️ Action Items für Sprint 2

| Aufgabe                                             | Verantwortlich | Deadline      |
|-----------------------------------------------------|----------------|---------------|
| `docker-ci.yml` deaktivieren oder korrigieren       | Roman          | 24.06.2025    |
| `api-arbeitsagentur` & `cleanup` in `main` mergen   | Team           | 24.06.2025    |
| `.env.example` & README.md finalisieren             | Bahram,Margarethe| 25.06.25    |
| Keyword-Suche & Bookmark-Funktion finalisieren      | Team           | 26.06.2025    |
| Retrospektive Sprint 2 vorbereiten                  | Margarethe     | 27.06.2025    |

---
