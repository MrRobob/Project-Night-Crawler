import requests
import os
import uuid
from mongodb_connect import collection

# Arbeitsagentur API-Konfiguration
API_URL = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs"

# Fallback HTTP headers for requests (can be overridden/imported later)
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "*/*",
}


def _fetch_detail_link(refnr: str | None = None, hash_id: str | None = None, session: requests.Session | None = None) -> str | None:
    if not session:
        session = requests.Session()

    details_url = None
    if hash_id:
        details_url = f"{API_URL}/{hash_id}"
    else:
        return None

    try:
        r = session.get(details_url, headers=DEFAULT_HEADERS, timeout=10)
        if r.ok:
            data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
            # Häufige Felder für den externen Bewerbungs-/Anzeigen-Link:
            return (
                data.get("externeUrl")
                or data.get("externeURL")
                or data.get("applyUrl")
                or data.get("stellenangebotURL")
                or None
            )
    except Exception:
        pass
    return None


def get_headers():
    api_key = os.getenv("BAA_API_KEY")
    if not api_key:
        raise RuntimeError("❌ BAA_API_KEY ist nicht gesetzt!")
    return {"X-API-Key": api_key}


def crawl_arbeitsagentur(keywords, location, radius, collection=collection):
    # Crawler für die Arbeitsagentur-API

    if isinstance(keywords, str):
        keywords = [keywords]  # Sicherstellen, dass keywords eine Liste ist

    all_new_jobs = []  # Liste für alle neuen Jobs

    keywords = [kw.strip() for kw in keywords if kw.strip()]  # Leere Keywords entfernen
    if not keywords:
        keywords = [None]  # Wenn keine Keywords angegeben sind, setze auf None

    for keyword in keywords:
        params = {  # Suchparameter für die API
            "pav": "true",  # Vermittlung durch die Arbeitsagentur
            "angebotsart": "1",  # Angebotsart: 1 für Stellenangebote
            "size": 100,  # Anzahl der Ergebnisse pro Seite
            "veroeffentlichtseit": 60,  # Ergebnisse der letzten 30 Tage
            "was": keyword  # Suchbegriff, z.B. Jobtitel
        }
        if keyword is not None:
            params["was"] = keyword
        if location:
            params["wo"] = location  # Ort
        if radius:
            params["umkreis"] = radius  # Umkreis in km

        print(f"🔍 API Abfrage mit Parametern: {params}")

        try:
            response = requests.get(
                API_URL, headers=get_headers(), params=params, timeout=30
            )  # API-Anfrage senden
            response.raise_for_status()  # Fehler bei der Anfrage auslösen
            data = response.json()

            new_jobs = []
            if not data.get("stellenangebote"):
                print("Keine neuen Jobs gefunden.")
                continue  # nicht die ganze Funktion beenden, nur diesen Durchlauf
            for job in data.get("stellenangebote", []):
                # 1) Referenznummer aus dem Treffer holen (verschiedene mögliche Feldnamen)
                refnr = job.get("refnr") or job.get("refNr") or job.get("referenceNumber")
                hash_id = job.get("hashId") or job.get("hashID")
                job_entry = {
                    "_id": job.get("hashId", "") or str(uuid.uuid4()),
                    "title": job.get("beruf", "") or "",
                    "company": job.get("arbeitgeber", "") or "",
                    "location": job.get("arbeitsort", "") or "",
                    # Link: extern > stellenangebotURL > BA-Fallback (ohne Details-Call)
                    "link": (
                        job.get("externeUrl")
                        or job.get("externeURL")
                        or job.get("stellenangebotURL")
                        or _fetch_detail_link(refnr=refnr, hash_id=hash_id)   # zieht externen Link aus Details, wenn vorhanden
                        or (f"https://www.arbeitsagentur.de/jobsuche/jobdetail/{refnr}" if refnr else "")
                    ),
                    # refnr mitschreiben (hilft für spätere Backfills)
                    "refnr": refnr,
                    "source": "Arbeitsagentur",
                    "bookmark": False
                }

                # In die Datenbank einfügen
                new_jobs.append(job_entry)

            # Nur speichern, wenn explizit eine Collection übergeben wurde
            if collection is not None and new_jobs:
                collection.insert_many(new_jobs, ordered=False)
                print(f"{len(new_jobs)} Jobs in MongoDB von der Arbeitsagentur gespeichert.")
            all_new_jobs.extend(new_jobs)

        except Exception as e:
            if isinstance(e, requests.HTTPError) and response.status_code == 403:
                print("❌ Zugriff verweigert. Bitte überprüfe deinen API-Schlüssel.")
            print(f"Fehler beim Abrufen der API-Daten: {e}")
            continue
    return all_new_jobs
