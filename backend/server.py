from flask import Flask, request, jsonify
from flask_cors import CORS
from crawl_stepstone import crawl_stepstone
from mongodb_connect import collection

app = Flask(__name__) # Erstellt eine Flask-Instanz, damit wir die Flask-Funktionen nutzen können
CORS(app) # Erlaubt Cross-Origin-Requests, das sind Anfragen von einer anderen Domain

@app.route('/jobsuchen', methods=['GET', 'POST']) # Definiert die Route und die erlaubten Methoden
def jobsuchen():
    if request.method == 'POST':

        data = request.json # Holt die JSON-Daten aus der Anfrage
        keywords = data.get('keywords', []) # Holt die Keywords aus den Daten, Standard ist eine leere Liste
        location = data.get('location', '') # Holt den Standort aus den Daten, Standard ist ein leerer String
        radius = int(data.get('radius', '30')) # Holt den Radius aus den Daten, Standard ist 30 (in km)

        print("Scraping gestartet mit:", keywords, location, radius) 
        jobs = crawl_stepstone(keywords, location, radius) # Hier wird die Funktion zum Scrapen aufgerufen und die Jobs werden in der Variable jobs gespeichert

        collection.delete_many({}) # Löscht alle alten Jobs in der Datenbank, um Platz für neue zu schaffen
        print("Alle alten Jobs in der Datenbank gelöscht.")
        
        for job in jobs: 

            result = collection.insert_one(job) # Hier wird jeder Job in die Datenbank eingefügt
            job['_id'] = str(result.inserted_id) # Hier wird die ID des eingefügten Jobs in das Job-Dictionary eingefügt

        print(f"{len(jobs)} Jobs in MongoDB gespeichert.")
        return jsonify(jobs) # Gibt die Jobs als JSON zurück
    
    elif request.method == 'GET':

        jobs = list(collection.find({}, {'title': 1, 'company': 1, 'link': 1})) # Hier werden alle Jobs aus der Datenbank abgerufen
        print(f"{len(jobs)} Jobs aus MongoDB abgerufen.")
        return jsonify(jobs) # Gibt die Jobs als JSON zurück

if __name__ == '__main__': # Startet die Flask-App
    app.run(host='0.0.0.0', port=3050) # Startet die App auf dem Host