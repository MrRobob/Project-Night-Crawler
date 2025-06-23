from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import os
from dotenv import load_dotenv
from crawl_stepstone import crawl_stepstone
from mongodb_connect import collection, search_alerts_collection, search_results_collection
from bson.objectid import ObjectId
from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from crawler_api_baa import crawl_arbeitsagentur # Importiert den Arbeitsagentur-Crawler

load_dotenv() # Lädt Umgebungsvariablen aus der .env-Datei
app = Flask(__name__) # Erstellt eine Flask-Instanz, um Flask-Funktionen zu nutzen
CORS(app) # Erlaubt Cross-Origin-Requests von verschiedenen Domains


# Konfiguriert Flask-Mail-Einstellungen aus Umgebungsvariablen
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

# Initialisiert Flask-Mail
mail = Mail(app)

# Funktion zum Senden von E-Mail-Benachrichtigungen
def send_email(to_email, subject, body):
    try:
        msg = Message(subject, recipients=[to_email], body=body)
        mail.send(msg)
        print(f"Email erfolgreich gesendet an {to_email}.")
    except Exception as e:
        print(f"Fehler beim Senden der Email: {e}")

# Route für die Jobsuche (POST für neue Suche, GET für aktuelle nicht-gebookmarkte Jobs)
@app.route('/jobsuchen', methods=['GET', 'POST'])
def jobsuchen():
    if request.method == 'POST':
        data = request.json # Holt JSON-Daten aus der Anfrage
        keywords = data.get('keywords', []) # Holt Keywords, Standard ist eine leere Liste
        location = data.get('location', '') # Holt den Standort, Standard ist ein leerer String
        radius = int(data.get('radius', '30')) # Holt den Radius, Standard ist 30 km

        print("Scraping gestartet mit:", keywords, location, radius)
        
        # Initialisiert Joblisten
        new_jobs_stepstone = []
        # Überprüfen, ob der StepStone-Crawler aktiv sein soll
        # new_jobs_stepstone = crawl_stepstone(keywords, location, radius) # Auskommentierung entfernen, wenn StepStone-Crawler aktiv ist

        new_jobs_arbeitsagentur = crawl_arbeitsagentur(keywords, location, radius)
        new_jobs = new_jobs_stepstone + new_jobs_arbeitsagentur

        for job in new_jobs:
            job['bookmark'] = False # Initialisiert den Bookmark-Status auf False

        # Löscht alte, nicht-gebookmarkte Jobs, um Platz für neue zu schaffen
        collection.delete_many({"bookmark": False})
        print("Alle alten nicht-gebookmarkten Jobs aus der Datenbank gelöscht.")

        # Ruft alle aktuell gebookmarkten Jobs ab
        bookmarked_jobs = [
            {**job, '_id': str(job['_id'])} for job in collection.find({"bookmark": True})
        ]

        unique_jobs = []
        for new_job in new_jobs:
            # Überprüfen, ob der neue Job (Titel, Firma, Link) bereits gebookmarkt ist
            if not any(
                bookmarked_job['title'] == new_job['title'] and
                bookmarked_job['company'] == new_job['company'] and
                bookmarked_job['link'] == new_job['link']
                for bookmarked_job in bookmarked_jobs
            ):
                # Überprüfen, ob Job mit derselben _id (von der Arbeitsagentur) bereits existiert
                if new_job.get('_id') and collection.count_documents({"_id": new_job.get('_id')}, limit=1) > 0:
                    print(f"Job mit _id {new_job.get('_id')} existiert bereits, überspringe Einfügung.")
                    continue # Überspringen, wenn Job bereits über _id existiert

                # Wenn der Job von der Arbeitsagentur-API stammt, hat er möglicherweise bereits eine hashId als _id
                # Wenn nicht, generiert MongoDB eine beim Einfügen
                result = collection.insert_one(new_job)
                if '_id' not in new_job: # Nur aktualisieren, wenn _id von MongoDB generiert wurde
                    new_job['_id'] = str(result.inserted_id)
                else: # Sicherstellen, dass _id ein String ist, wenn es vom Crawler kam
                    new_job['_id'] = str(new_job['_id'])
                unique_jobs.append(new_job)
                print(f"Neuer Job eingefügt: {new_job['title']} bei {new_job['company']}")


        print(f"{len(unique_jobs)} Jobs in MongoDB gespeichert.")
        return jsonify(unique_jobs) # Gibt Jobs als JSON zurück

    elif request.method == 'GET':
        # Ruft alle nicht-gebookmarkten Jobs aus der Datenbank ab
        jobs = [
            {**job, '_id': str(job['_id'])}
            for job in collection.find({"bookmark": False}, {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1})
        ]
        print(f"{len(jobs)} Jobs aus MongoDB abgerufen.")
        return jsonify(jobs) # Gibt Jobs als JSON zurück

# Diese Route durchsucht StepStone nach Jobs und gibt die Ergebnisse zurück.
# (Hinweis: In Ihrer aktuellen jobsuchen-Funktion ist der StepStone-Crawler auskommentiert, aber die Route bleibt bestehen)
@app.route('/jobsuchen_baa', methods=['POST'])
def jobsuchen_baa():
    if request.method == 'POST':
        data = request.json
        keywords = data.get('keywords', [])
        location = data.get('location', '')
        radius = int(data.get('radius', 30))

        print(f"Starte Arbeitsagentur-Crawl mit: {keywords}, {location}, {radius}km")

        # Übergibt die Collection an die crawl_arbeitsagentur Funktion für direkte Einfügung
        new_jobs = crawl_arbeitsagentur(keywords, location, radius, collection)

        return jsonify(new_jobs)


# Route zum Aktualisieren des Bookmark-Status eines Jobs
@app.route('/update_bookmark', methods=['POST'])
def update_bookmark():
    try:
        data = request.json
        job_id = data.get('job_id') # Erwartet 'job_id' vom Frontend
        bookmark_status = data.get('bookmark') # Erwartet true oder false

        # Prüfen, ob job_id oder bookmark_status fehlen
        if not job_id or bookmark_status is None:
            print(f"Fehler: Fehlende job_id oder bookmark-Status in Anfrage: {data}")
            return jsonify({"status": "error", "message": "Fehlende job_id oder bookmark-Status."}), 400

        # MongoDB ObjectId muss korrekt umgewandelt werden
        # Sicherstellen, dass job_id ein gültiger ObjectId-String ist
        try:
            object_id = ObjectId(job_id)
        except Exception:
            print(f"Fehler: Ungültiges Job-ID Format: {job_id}")
            return jsonify({"status": "error", "message": "Ungültiges Job-ID Format."}), 400

        # Aktualisiert den Bookmark-Status in der Datenbank
        result = collection.update_one(
            {'_id': object_id},
            {'$set': {'bookmark': bookmark_status}}
        )

        if result.matched_count == 0:
            # Kein Job mit dieser ID gefunden
            print(f"Job mit ID {job_id} nicht gefunden.")
            return jsonify({"status": "error", "message": "Job nicht gefunden."}), 404
        elif result.modified_count == 0:
            # Job gefunden, aber Status war bereits korrekt
            print(f"Job {job_id}: Bookmark-Status ist bereits aktuell.")
            return jsonify({"status": "success", "message": "Bookmark-Status ist bereits aktuell."}), 200
        else:
            # Job erfolgreich aktualisiert
            action = "gebookmarkt" if bookmark_status else "entbookmarkt"
            print(f"Job {job_id} erfolgreich {action}.")
            return jsonify({"status": "success", "message": f"Job {job_id} erfolgreich {action}."}), 200

    except Exception as e:
        # Allgemeiner Fehler bei der Aktualisierung
        print(f"Unerwarteter Fehler beim Aktualisieren des Bookmark-Status für Job {job_id}: {e}")
        return jsonify({"status": "error", "message": f"Interner Serverfehler: {str(e)}"}), 500

# Route zum Abrufen aller gebookmarkten Jobs
@app.route('/bookmarked_jobs', methods=['GET'])
def get_bookmarked_jobs():
    jobs = list(collection.find({"bookmark": True}, {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1}))
    for job in jobs:
        job['_id'] = str(job['_id']) # Konvertiert ObjectId in String für JSON-Serialisierung
    print(f"{len(jobs)} gebookmarkte Jobs aus MongoDB abgerufen.")
    return jsonify(jobs)

# Route zum Speichern eines neuen Suchauftrags
@app.route('/save_search', methods=['POST'])
def save_search():
    try:
        data = request.json
        keywords = data.get('keywords', [])
        location = data.get('location', '')
        radius = int(data.get('radius', '30'))
        email = data.get('email', '')

        # Grundlegende Validierung
        if not keywords or not location or not email:
            print(f"Fehler: Fehlende Daten zum Speichern des Suchauftrags: {data}")
            return jsonify({"status": "error", "message": "Fehlende Keywords, Ort oder E-Mail."}), 400

        search_alerts_data = {
            "keywords": keywords,
            "location": location,
            "radius": radius,
            "email": email
        }
        result = search_alerts_collection.insert_one(search_alerts_data)
        # Sicherstellen, dass die eingefügte ID für die Antwort in einen String konvertiert wird
        search_alerts_data['_id'] = str(result.inserted_id)
        print(f"Suchauftrag erfolgreich gespeichert mit ID: {search_alerts_data['_id']}")
        return jsonify({'status': 'success', 'message': 'Suchauftrag erfolgreich gespeichert.', 'search_alert': search_alerts_data}), 201 # 201 für Created
    except Exception as e:
        print(f"Fehler beim Speichern des Suchauftrags: {e}")
        return jsonify({"status": "error", "message": f"Interner Serverfehler: {str(e)}"}), 500


# Route zum Abrufen aller Suchaufträge
@app.route('/search_alerts', methods=['GET'])
def get_search_alerts():
    try:
        search_alerts = list(search_alerts_collection.find({}, {'keywords': 1, 'location': 1, 'radius': 1, 'email': 1}))
        for alert in search_alerts:
            alert['_id'] = str(alert['_id']) # Konvertiert ObjectId in String
        print(f"{len(search_alerts)} Suchaufträge abgerufen.")
        return jsonify(search_alerts), 200
    except Exception as e:
        print(f"Fehler beim Abrufen der Suchaufträge: {e}")
        return jsonify({"status": "error", "message": f"Interner Serverfehler: {str(e)}"}), 500

# Route zum Löschen eines spezifischen Suchauftrags nach ID
@app.route('/delete_search_alert/<string:alert_id>', methods=['DELETE'])
def delete_search_alert(alert_id):
    try:
        # Konvertiert alert_id String in ObjectId
        try:
            object_id = ObjectId(alert_id)
        except Exception:
            print(f"Fehler: Ungültiges Suchauftrag-ID Format: {alert_id}")
            return jsonify({"status": "error", "message": "Ungültiges Suchauftrag-ID Format."}), 400

        result = search_alerts_collection.delete_one({'_id': object_id})
        if result.deleted_count == 1:
            print(f"Suchauftrag {alert_id} erfolgreich gelöscht.")
            return jsonify({'status': 'success', 'message': 'Suchauftrag erfolgreich gelöscht.'}), 200
        else:
            print(f"Suchauftrag {alert_id} nicht zum Löschen gefunden.")
            return jsonify({'status': 'error', 'message': 'Suchauftrag nicht gefunden.'}), 404
    except Exception as e:
        print(f"Fehler beim Löschen des Suchauftrags {alert_id}: {e}")
        return jsonify({"status": "error", "message": f"Interner Serverfehler: {str(e)}"}), 500

# NEUE ROUTE: Zum Aktualisieren eines Suchauftrags
@app.route('/update_search_alert/<string:alert_id>', methods=['PUT'])
def update_search_alert(alert_id):
    try:
        data = request.json # Holt die JSON-Daten aus der Anfrage
        
        # Konvertiert alert_id String in ObjectId
        try:
            object_id = ObjectId(alert_id)
        except Exception:
            print(f"Fehler: Ungültiges Suchauftrag-ID Format für Aktualisierung: {alert_id}")
            return jsonify({"status": "error", "message": "Ungültiges Suchauftrag-ID Format."}), 400

        # Erstellen eines Dictionary für die zu aktualisierenden Felder
        update_fields = {}
        if 'keywords' in data:
            update_fields['keywords'] = data['keywords']
        if 'location' in data:
            update_fields['location'] = data['location']
        if 'radius' in data:
            update_fields['radius'] = int(data['radius'])
        if 'email' in data:
            update_fields['email'] = data['email']

        # Grundlegende Validierung: Sicherstellen, dass mindestens ein Feld zum Aktualisieren vorhanden ist
        if not update_fields:
            print(f"Fehler: Keine Felder zum Aktualisieren für Suchauftrag {alert_id} angegeben.")
            return jsonify({"status": "error", "message": "Keine Felder zum Aktualisieren angegeben."}), 400

        result = search_alerts_collection.update_one(
            {'_id': object_id},
            {'$set': update_fields}
        )

        if result.matched_count == 0:
            print(f"Suchauftrag mit ID {alert_id} nicht gefunden für Aktualisierung.")
            return jsonify({"status": "error", "message": "Suchauftrag nicht gefunden."}), 404
        elif result.modified_count == 0:
            print(f"Suchauftrag {alert_id}: Keine Änderungen vorgenommen (Daten sind bereits aktuell).")
            return jsonify({"status": "success", "message": "Suchauftrag-Daten sind bereits aktuell."}), 200
        else:
            print(f"Suchauftrag {alert_id} erfolgreich aktualisiert.")
            return jsonify({"status": "success", "message": "Suchauftrag erfolgreich aktualisiert."}), 200

    except ValueError as ve:
        print(f"Fehler bei der Datenkonvertierung für Suchauftrag {alert_id}: {ve}")
        return jsonify({"status": "error", "message": f"Fehler bei der Datenkonvertierung: {str(ve)}"}), 400
    except Exception as e:
        print(f"Unerwarteter Fehler beim Aktualisieren des Suchauftrags {alert_id}: {e}")
        return jsonify({"status": "error", "message": f"Interner Serverfehler: {str(e)}"}), 500


# Initialisiert den Hintergrund-Scheduler
scheduler = BackgroundScheduler()

# Funktion zur regelmäßigen Ausführung gespeicherter Suchaufträge
def execute_search_alerts():
    # Stellt den Flask-App-Kontext für den Datenbankzugriff bereit
    with app.app_context():
        alerts = list(search_alerts_collection.find())
        print(f"[{datetime.datetime.now()}] Führe gespeicherte Suchaufträge aus.")

        for alert in alerts:
            keywords = alert.get('keywords', [])
            location = alert.get('location', '')
            radius = int(alert.get('radius', '30'))
            email = alert.get('email', '')
            alert_id = str(alert.get('_id')) # Holt die Alert-ID für Logging und Job-Zuordnung

            print(f"Verarbeite Suchauftrag (ID: {alert_id}): Keywords={keywords}, Ort={location}, Radius={radius}, Email={email}")

            new_jobs = []
            # Optional auskommentieren, wenn StepStone-Crawls in geplanten Alerts enthalten sein sollen
            # new_jobs_stepstone = crawl_stepstone(keywords, location, radius)
            # new_jobs.extend(new_jobs_stepstone)

            new_jobs_arbeitsagentur = crawl_arbeitsagentur(keywords, location, radius, collection) # Übergibt die Collection für direkte Speicherung
            # Hinweis: Wenn crawl_arbeitsagentur direkt einfügt, ist new_jobs hier leer.
            # Sie müssen crawl_arbeitsagentur möglicherweise anpassen, um die gefundenen Jobs ebenfalls zurückzugeben.
            new_jobs.extend(new_jobs_arbeitsagentur) # Fügt vom Crawler zurückgegebene Jobs hinzu

            # Verknüpft Jobs mit dem aktuellen Suchauftrag und fügt Zeitstempel hinzu
            for job in new_jobs:
                job['search_alert_id'] = alert_id
                job['timestamp'] = datetime.datetime.now()

            # Findet bestehende Links für diesen Alert, um Duplikate in search_results_collection zu vermeiden
            existing_links_for_alert = [
                job['link'] for job in search_results_collection.find({"search_alert_id": alert_id})
            ]
            unique_jobs_for_alert = [job for job in new_jobs if job['link'] not in existing_links_for_alert]

            if unique_jobs_for_alert:
                search_results_collection.insert_many(unique_jobs_for_alert)
                print(f"{len(unique_jobs_for_alert)} neue Ergebnisse für Suchauftrag {alert_id} gespeichert.")

                if email:
                    subject = f"Neue Jobs für deinen Suchauftrag: {', '.join(keywords)}"
                    body = f"Es wurden {len(unique_jobs_for_alert)} neue Stellen gefunden:\n\n"
                    for job in unique_jobs_for_alert:
                        body += f"- {job['title']} bei {job['company']} ({job['link']})\n"
                    send_email(email, subject, body)
            else:
                print(f"Keine neuen einzigartigen Jobs für Suchauftrag {alert_id} gefunden.")


# Plant die Ausführung von Suchaufträgen alle 8 Stunden
scheduler.add_job(execute_search_alerts, 'interval', hours=8)
scheduler.start()

# Route zum Abrufen von Suchergebnissen für eine spezifische Alert-ID
@app.route('/get_search_results/<string:alert_id>', methods=['GET'])
def get_search_results(alert_id):
    try:
        # Konvertiert alert_id String in ObjectId
        try:
            object_id = ObjectId(alert_id) # Diese Zeile ist hier nicht direkt erforderlich, da die Abfrage nach String erfolgt
        except Exception:
            print(f"Fehler: Ungültiges Suchauftrag-ID Format zum Abrufen der Ergebnisse: {alert_id}")
            return jsonify({"status": "error", "message": "Ungültiges Suchauftrag-ID Format."}), 400

        results = list(search_results_collection.find({"search_alert_id": alert_id})) # Hinweis: Hier wird nach String gefiltert, nicht nach ObjectId, da search_alert_id als String gespeichert wird
        for result in results:
            result['_id'] = str(result['_id']) # Konvertiert ObjectId in String
        print(f"{len(results)} Suchergebnisse für Alert-ID {alert_id} abgerufen.")
        return jsonify(results), 200
    except Exception as e:
        print(f"Fehler beim Abrufen der Suchergebnisse für Alert {alert_id}: {e}")
        return jsonify({"status": "error", "message": f"Interner Serverfehler: {str(e)}"}), 500


# Startet die Flask-Anwendung
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3050, debug=True) # Startet die App auf Host 0.0.0.0 und Port 3050, mit Debugging aktiviert
