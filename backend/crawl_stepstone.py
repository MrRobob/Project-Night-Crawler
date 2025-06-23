import re
import requests
import time
from bs4 import BeautifulSoup
from requests.exceptions import RequestException

def crawl_stepstone(keywords, location, radius):
    """
    Durchsucht StepStone nach Jobs anhand von Keywords, Standort und Radius.
    Gibt eine Liste mit Jobdaten zurück.
    """

    # Keywords & Location formatieren
    formatted_keywords_a = "-".join(keywords)
    formatted_location = location.lower().replace(" ", "-")

    # Grund-URL mit Platzhaltern für Radius
    url = f"https://www.stepstone.de/jobs/{formatted_keywords_a}/in-{formatted_location}?radius={radius}&sort=2&action=sort_publish"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    new_jobs = []

    # Durchsuche Seiten 1 bis 6
    for page in range(1, 7):
        search_url = f"{url}&page={page}"
        print(f"🔍 Suche auf: {search_url}")

        try:
            response = requests.get(search_url, headers=headers, timeout=30)
            response.raise_for_status()
            print("Status Code:", response.status_code)
            print(response.text[:500])  # Nur ein Ausschnitt zur Prüfung

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, "html.parser")
                job_cards = soup.find_all("article", attrs={"data-testid": "job-item"})

                for job in job_cards:
                    title_element = job.find("a", href=True)
                    title = title_element.get_text(strip=True) if title_element else "Kein Titel"
                    link = "https://www.stepstone.de" + title_element["href"] if title_element else "Kein Link"

                    company = job.find("span", attrs={"data-testid": "job-item-company-name"})
                    company_text = company.get_text(strip=True) if company else "Keine Firma"

                    job_data = {
                        "title": title,
                        "company": company_text,
                        "link": link,
                        "source": "StepStone"
                    }

                    new_jobs.append(job_data)

        except RequestException as e:
            print(f"❌ Fehler bei der Anfrage an Seite {page}: {e}")

    return new_jobs


if __name__ == "__main__":
    result = crawl_stepstone(["javascript", "entwickler"], "berlin", 30)
    for job in result:
        print(job)
