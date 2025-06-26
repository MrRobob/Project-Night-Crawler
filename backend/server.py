from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import os
from dotenv import load_dotenv
from mongodb_connect import (
    collection,
    search_alerts_collection,
    search_results_collection,
)
from bson.objectid import ObjectId
from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from crawler_api_baa import crawl_arbeitsagentur

load_dotenv()  # Lädt die Umgebungsvariablen aus der .env-Datei

app = Flask(__name__)  # Erstellt eine Flask-Instanz
CORS(app)  # Erlaubt Cross-Origin-Requests

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

# Flask-Mail initialisieren
mail = Mail(app)


def send_email(to_email, subject, body):
    try:
        msg = Message(subject, recipients=[to_email], body=body)
        mail.send(msg)
        print(f"Email erfolgreich gesendet an {to_email}.")
    except Exception as e:
        print(f"Fehler beim Senden der Email: {e}")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/jobsuchen', methods=['GET', 'POST'])
def jobsuchen():
    if request.method == 'POST':
        data = request.json
        keywords = data.get('keywords', [])
        location = data.get('location', '')
        radius = int(data.get('radius', '30'))

        print("Scraping gestartet mit:", keywords, location, radius)
        new_jobs_stepstone = []
        new_jobs_arbeitsagentur = crawl_arbeitsagentur(keywords, location, radius)
        new_jobs = new_jobs_stepstone + new_jobs_arbeitsagentur

        for job in new_jobs:
            job['bookmark'] = False

        collection.delete_many({"bookmark": False})
        print("Alle alten Jobs in der Datenbank gelöscht.")

        bookmarked_jobs = [
            {**job, '_id': str(job['_id'])}
            for job in collection.find({"bookmark": True})
        ]

        unique_jobs = []
        for new_job in new_jobs:
            if not any(
                bookmarked_job['title'] == new_job['title'] and
                bookmarked_job['company'] == new_job['company'] and
                bookmarked_job['link'] == new_job['link']
                for bookmarked_job in bookmarked_jobs
            ):
                if collection.count_documents(
                    {"_id": new_job.get('_id')}, limit=1
                ) == 0:
                    result = collection.insert_one(new_job)
                    new_job['_id'] = str(result.inserted_id)
                    unique_jobs.append(new_job)
                    print(
                        f"Neuer Job eingefügt: {new_job['title']} bei "
                        f"{new_job['company']}"
                    )

        print(f"{len(unique_jobs)} Jobs in MongoDB gespeichert.")
        return jsonify(unique_jobs)

    elif request.method == 'GET':
        jobs = [
            {**job, '_id': str(job['_id'])}
            for job in collection.find(
                {"bookmark": False},
                {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1}
            )
        ]
        print(f"{len(jobs)} Jobs aus MongoDB abgerufen.")
        return jsonify(jobs)


@app.route('/jobsuchen_baa', methods=['POST'])
def jobsuchen_baa():
    if request.method == 'POST':
        data = request.json
        keywords = data.get('keywords', [])
        location = data.get('location', '')
        radius = int(data.get('radius', 30))

        print(
            f"Starte Arbeitsagentur-Crawl mit: {keywords}, {location}, "
            f"{radius}km"
        )

        new_jobs = crawl_arbeitsagentur(keywords, location, radius, collection)

        return jsonify(new_jobs)


@app.route('/update_bookmark', methods=['POST'])
def update_bookmark():
    data = request.json
    job_id = data.get('_id')
    bookmark_status = data.get('bookmark')

    if not job_id or bookmark_status is None:
        return jsonify({
            'error': 'Job-ID und Bookmark-Status müssen angegeben werden.'
        }), 400

    if ObjectId.is_valid(job_id):
        query = {'_id': ObjectId(job_id)}
    else:
        query = {'_id': job_id}

    result = collection.update_one(query, {'$set': {'bookmark': bookmark_status}})

    if result.matched_count != 1:
        return jsonify({'error': 'Job nicht gefunden.'}), 404

    return jsonify({'success': True})


@app.route('/bookmarked_jobs', methods=['GET'])
def get_bookmarked_jobs():
    jobs = list(
        collection.find(
            {"bookmark": True},
            {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1}
        )
    )
    for job in jobs:
        job['_id'] = str(job['_id'])
    print(f"{len(jobs)} bookmarked Jobs aus MongoDB abgerufen.")
    return jsonify(jobs)


@app.route('/update_search_alert/<string:id>', methods=['POST'])
def update_search_alert(id):
    data = request.json
    updated_data = {
        "keywords": data.get('keywords', []),
        "location": data.get('location', ''),
        "radius": int(data.get('radius', 30)),
        "email": data.get('email', '')
    }

    result = search_alerts_collection.update_one(
        {'_id': ObjectId(id)},
        {'$set': updated_data}
    )
    if result.modified_count == 1:
        return jsonify({
            'success': True, 'message': 'Suchauftrag erfolgreich aktualisiert.'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Suchauftrag nicht gefunden oder keine Änderungen vorgenommen.'
        }), 404


@app.route('/save_search', methods=['POST'])
def save_search():
    data = request.json
    keywords = data.get('keywords', [])
    location = data.get('location', '')
    radius = int(data.get('radius', '30'))
    email = data.get('email', '')

    search_alerts_data = {
        "keywords": keywords,
        "location": location,
        "radius": radius,
        "email": email
    }
    result = search_alerts_collection.insert_one(search_alerts_data)
    search_alerts_data['_id'] = str(result.inserted_id)
    return jsonify({'success': True, 'search_alert': search_alerts_data})


@app.route('/search_alerts', methods=['GET'])
def get_search_alerts():
    search_alerts = list(
        search_alerts_collection.find(
            {},
            {'keywords': 1, 'location': 1, 'radius': 1, 'email': 1}
        )
    )
    for alert in search_alerts:
        alert['_id'] = str(alert['_id'])

    return jsonify(search_alerts)


@app.route('/delete_search_alert/<string:id>', methods=['DELETE'])
def delete_search_alert(id):
    result = search_alerts_collection.delete_one({'_id': ObjectId(id)})
    if result.deleted_count == 1:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Suchauftrag nicht gefunden'}), 404


scheduler = BackgroundScheduler()


def execute_search_alerts():
    with app.app_context():
        alerts = list(search_alerts_collection.find())
        print(
            f"[{datetime.datetime.now()}] Starte Ausführung für "
            f"{len(alerts)} gespeicherte Suchaufträge."
        )

        for alert in alerts:
            alert_id_str = str(alert['_id'])
            keywords = alert.get('keywords', [])
            location = alert.get('location', '')
            radius = int(alert.get('radius', '30'))
            email = alert.get('email', '')

            if not email:
                print(
                    f"Suchauftrag {alert_id_str} hat keine E-Mail-Adresse. "
                    f"Überspringe."
                )
                continue

            print(
                f"Führe Suchauftrag aus für: {keywords} in {location} "
                f"({radius}km)"
            )

            print(
                f"-> Crawle bei Arbeitsagentur für Suchauftrag {alert_id_str}..."
            )
            new_jobs_baa = crawl_arbeitsagentur(
                keywords, location, radius, collection
            )

            all_new_jobs = new_jobs_baa
            print(
                f"-> Insgesamt {len(all_new_jobs)} Jobs gefunden."
            )

            existing_links = {
                job['link']
                for job in search_results_collection.find(
                    {'search_alert_id': alert_id_str},
                    {'link': 1}
                )
            }

            unique_new_jobs = [
                job for job in all_new_jobs
                if job.get('link') and job['link'] not in existing_links
            ]

            if unique_new_jobs:
                print(
                    f"Gefunden: {len(unique_new_jobs)} wirklich neue Jobs für "
                    f"Suchauftrag {alert_id_str}."
                )

                for job in unique_new_jobs:
                    job['search_alert_id'] = alert_id_str
                    job['timestamp'] = datetime.datetime.now()

                search_results_collection.insert_many(unique_new_jobs)

                subject = (
                    f"Neue Jobangebote für deine Suche: {', '.join(keywords)}"
                )

                body = (
                    f"Hallo,\n\nes wurden {len(unique_new_jobs)} neue Stellen "
                    f"für deinen Suchauftrag gefunden:\n\n"
                )
                for job in unique_new_jobs:
                    body += f"- Titel: {job.get('title', 'N/A')}\n"
                    body += f"  Firma: {job.get('company', 'N/A')}\n"
                    body += f"  Quelle: {job.get('source', 'N/A')}\n"
                    body += f"  Link: {job.get('link', 'N/A')}\n\n"

                body += "Viel Erfolg bei deiner Bewerbung!\n\nDein Night-Crawler"

                send_email(email, subject, body)
            else:
                print(
                    f"Keine neuen Jobs für Suchauftrag {alert_id_str} gefunden."
                )


scheduler.add_job(execute_search_alerts, 'interval', minutes=1)
scheduler.start()


@app.route('/get_search_results/<string:alert_id>', methods=['GET'])
def get_search_results(alert_id):
    results = list(
        search_results_collection.find({"search_alert_id": alert_id})
    )
    for result in results:
        result['_id'] = str(result['_id'])
    return jsonify(results)


if __name__ == '__main__':  # Startet die Flask-App
    app.run(host='0.0.0.0', port=3050)
