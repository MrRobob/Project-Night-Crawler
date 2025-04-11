from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail
import os
from dotenv import load_dotenv
from crawl_stepstone import crawl_stepstone
from mongodb_connect import collection, search_alerts_collection, search_results_collection
from bson.objectid import ObjectId
from apscheduler.schedulers.background import BackgroundScheduler
import datetime

load_dotenv() # Lädt die Umgebungsvariablen aus der .env-Datei
app = Flask(__name__) # Erstellt eine Flask-Instanz, damit wir die Flask-Funktionen nutzen können
CORS(app) # Erlaubt Cross-Origin-Requests, das sind Anfragen von einer anderen Domain


app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Flask-Mail initialisieren
mail = Mail(app)

@app.route('/jobsuchen', methods=['GET', 'POST']) # Definiert die Route und die erlaubten Methoden
def jobsuchen():
    if request.method == 'POST':

        data = request.json # Holt die JSON-Daten aus der Anfrage
        keywords = data.get('keywords', []) # Holt die Keywords aus den Daten, Standard ist eine leere Liste
        location = data.get('location', '') # Holt den Standort aus den Daten, Standard ist ein leerer String
        radius = int(data.get('radius', '30')) # Holt den Radius aus den Daten, Standard ist 30 (in km)

        print("Scraping gestartet mit:", keywords, location, radius) 
        new_jobs = crawl_stepstone(keywords, location, radius) # Hier wird die Funktion zum Scrapen aufgerufen und die Jobs werden in der Variable jobs gespeichert

        for job in new_jobs:
            job['bookmark'] = False

        collection.delete_many({"bookmark": False}) # Löscht alle alten Jobs in der Datenbank, um Platz für neue zu schaffen
        print("Alle alten Jobs in der Datenbank gelöscht.")

        bookmarked_jobs = [ # Hier werden alle Jobs aus der Datenbank abgerufen, die als Bookmarks gespeichert sind
            {**job, '_id': str(job['_id'])} for job in collection.find({"bookmark": True})
        ] 

        unique_jobs = []
        for new_job in new_jobs: 
            if not any(
                bookmarked_job['title'] == new_job['title'] and
                bookmarked_job['company'] == new_job['company'] and
                bookmarked_job['link'] == new_job['link']
                for bookmarked_job in bookmarked_jobs
            ):
                result = collection.insert_one(new_job) # Hier wird jeder Job in die Datenbank eingefügt
                new_job['_id'] = str(result.inserted_id) # Hier wird die ID des eingefügten Jobs in das Job-Dictionary eingefügt
                unique_jobs.append(new_job)

        print(f"{len(unique_jobs)} Jobs in MongoDB gespeichert.")
        return jsonify(unique_jobs) # Gibt die Jobs als JSON zurück
    
    elif request.method == 'GET':

        jobs = [ # Hier werden alle Jobs aus der Datenbank abgerufen
            {**job, '_id': str(job['_id'])} 
            for job in collection.find({"bookmark": False}, {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1})
        ]
        print(f"{len(jobs)} Jobs aus MongoDB abgerufen.")
        return jsonify(jobs) # Gibt die Jobs als JSON zurück

@app.route('/update_bookmark', methods=['POST'])
def update_bookmark():
    data = request.json
    job_id = data.get('_id')
    bookmark_status = data.get('bookmark')

    collection.update_one(
        {'_id': ObjectId(job_id)},
        {'$set': {'bookmark': bookmark_status}}
    )
    return jsonify({'success': True})

@app.route('/bookmarked_jobs', methods=['GET'])
def get_bookmarked_jobs():
    jobs = list(collection.find({"bookmark": True}, {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1}))
    for job in jobs:
        job['_id'] = str(job['_id'])
    print(f"{len(jobs)} bookmarked Jobs aus MongoDB abgerufen.")
    return jsonify(jobs)

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
    search_alerts = list(search_alerts_collection.find({}, {'keywords': 1, 'location': 1, 'radius': 1, 'email': 1}))
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
    alerts = list(search_alerts_collection.find())
    print(f"[{datetime.datetime.now()}] Ausführung der gespeicherten Suchaufträge gestartet.")

    for alert in alerts:
        keywords = alert.get('keywords', [])
        location = alert.get('location', '')
        radius = int(alert.get('radius', '30'))
        email = alert.get('email', '')

        new_jobs = crawl_stepstone(keywords, location, radius)

        for job in new_jobs:
            job['search_alert_id'] = str(alert['_id'])
            job['timestamp'] = datetime.datetime.now()

        existing_links = [job['link'] for job in search_results_collection.find()]
        unique_jobs = [job for job in new_jobs if job['link'] not in existing_links]

        if unique_jobs:
            search_results_collection.insert_many(unique_jobs)
            print(f"{len(unique_jobs)} neue Ergebnisse für Suchauftrag {alert['_id']} gespeichert.")

scheduler.add_job(execute_search_alerts, 'interval', hours=8) 
scheduler.start()

@app.route('/get_search_results/<string:alert_id>', methods=['GET'])
def get_search_results(alert_id):
    results = list(search_results_collection.find({"search_alert_id": alert_id}))
    for result in results:
        result['_id'] = str(result['_id'])
    return jsonify(results)

if __name__ == '__main__': # Startet die Flask-App
    app.run(host='0.0.0.0', port=3050) # Startet die App auf dem Host