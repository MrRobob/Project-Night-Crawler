from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_talisman import Talisman
import os
from dotenv import load_dotenv
from mongodb_connect import (
    collection,
    search_alerts_collection,
    search_results_collection,
    db,
)
from bson.objectid import ObjectId
from apscheduler.schedulers.background import BackgroundScheduler
from crawler_api_baa import crawl_arbeitsagentur
import logging
from logging.handlers import SocketHandler
from prometheus_flask_exporter import PrometheusMetrics
import bcrypt
from datetime import datetime, timedelta, UTC, timezone
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)


load_dotenv()  # Lädt die Umgebungsvariablen aus der .env-Datei

# Logger-Konfiguration für Logstash

logger = logging.getLogger("nightcrawler-backend")
logger.setLevel(logging.INFO)

# Console als Fallback immer aktiv lassen
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logger.addHandler(console)

# Logstash optional
LOGSTASH_HOST = os.getenv("LOGSTASH_HOST", "logstash")
LOGSTASH_PORT = int(os.getenv("LOGSTASH_PORT", "5000"))

try:
    sock = SocketHandler(LOGSTASH_HOST, LOGSTASH_PORT)
    sock.setLevel(logging.INFO)
    logger.addHandler(sock)
    logger.info(f"Logstash handler enabled at {LOGSTASH_HOST}:{LOGSTASH_PORT}")
except Exception as e:
    logger.warning(f"Logstash not available ({LOGSTASH_HOST}:{LOGSTASH_PORT}): {e}")


app = Flask(__name__)  # Erstellt eine Flask-Instanz
FRONTEND_ORIGIN = os.getenv("PUBLIC_APP_URL", "http://localhost:5173")
CORS(app, resources={r"/*": {"origins": [FRONTEND_ORIGIN]}})
Talisman(app, content_security_policy=None, force_https=False, strict_transport_security=False)  # Aktiviert Sicherheits-Header


@app.route("/")
def index():
    return "Hello, Talisman!"


@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"status": "ok", "message": "API funktioniert!"})


metrics = PrometheusMetrics(app, path="/metrics")  # Initialisiert Prometheus-Metriken
metrics.info("backend_app", "Nightcrawler Backend", version="1.0.0")
print("✅ Prometheus metrics endpoint registered: /metrics")


app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-change-me")  # setze im Prod per ENV
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
EMAIL_SECRET = os.getenv("EMAIL_SECRET", "dev-email-secret")
email_signer = URLSafeTimedSerializer(EMAIL_SECRET)
jwt = JWTManager(app)
PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "http://localhost:5173")

revoked = db["revoked_tokens"]
revoked.create_index("jti", unique=True)
revoked.create_index("exp_dt", expireAfterSeconds=0)

# Flask-Mail initialisieren
mail = Mail(app)

try:
    search_results_collection.create_index(
        [("search_alert_id", 1), ("link", 1)],
        unique=True,
        name="uniq_alert_link"
    )
except Exception:
    pass


def send_email(to_email, subject, body):
    try:
        with app.app_context():
            msg = Message(subject, recipients=[to_email], body=body)
            mail.send(msg)
            print(f"Email erfolgreich gesendet an {to_email}.")
    except Exception as e:
        print(f"Fehler beim Senden der Email: {e}")


users = db["users"]
try:
    users.create_index("email", unique=True)
except Exception:
    # Index existiert ggf. schon oder DB-User hat keine Rechte — safe to ignore in dev
    pass


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def issue_tokens(user_id):
    """Return access, refresh (strings). identity is user_id as string."""
    sub = str(user_id)
    access = create_access_token(identity=sub, additional_claims={"stage": "auth"})
    refresh = create_refresh_token(identity=sub)
    return access, refresh


# Email verification token helpers
def generate_email_token(user_id: str) -> str:
    return email_signer.dumps({"uid": str(user_id)}, salt="verify")


def verify_email_token(token: str, max_age: int = 60 * 60 * 24) -> str | None:
    try:
        data = email_signer.loads(token, salt="verify", max_age=max_age)
        return data.get("uid")
    except (SignatureExpired, BadSignature):
        return None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route('/jobsuchen', methods=['GET', 'POST'])
@jwt_required()
def jobsuchen():
    uid = get_jwt_identity()

    if request.method == 'POST':
        data = request.json
        keywords = data.get('keywords', [])
        location = data.get('location', '')
        radius = int(data.get('radius', '30'))

        # (A) ZUERST: alles nicht-gemerkte löschen
        collection.delete_many({"bookmark": False, "userId": uid})
        print(f"[{uid}] Alte (nicht gespeicherten) Jobs gelöscht.")

        print("Scraping gestartet mit:", keywords, location, radius)
        new_jobs_stepstone = []
        new_jobs_arbeitsagentur = crawl_arbeitsagentur(keywords, location, radius, None)
        new_jobs = new_jobs_stepstone + (new_jobs_arbeitsagentur or [])

        # (C) vorbereiten & einfügen (einmalig, aus dem Server)
        for job in new_jobs:
            job['bookmark'] = False
            job["userId"] = uid

        # Bookmarks schützen (nicht doppeln)
        bookmarked_jobs = [
            {**job, '_id': str(job['_id'])}
            for job in collection.find({"bookmark": True, "userId": uid})  # <-- scoped
        ]

        unique_jobs = []
        for new_job in new_jobs:
            # nicht einfügen, wenn als Bookmark schon vorhanden
            if any(
                b['title'] == new_job.get('title')
                and b['company'] == new_job.get('company')
                and b['link'] == new_job.get('link')
                for b in bookmarked_jobs
            ):
                continue

            # EXISTENZPRÜFUNG: per natürlichem Schlüssel statt _id
            exists = collection.count_documents(
                {
                    "userId": uid,
                    "title": new_job.get("title"),
                    "company": new_job.get("company"),
                    "link": new_job.get("link"),
                },
                limit=1
            )
            if exists == 0:
                result = collection.insert_one({**new_job, "bookmark": False})
                new_job["_id"] = str(result.inserted_id)
                unique_jobs.append(new_job)

        print(f"{len(unique_jobs)} Jobs in MongoDB gespeichert.")
        return jsonify(unique_jobs)

    elif request.method == 'GET':
        jobs = [
            {**job, '_id': str(job['_id'])}
            for job in collection.find(
                {"bookmark": False, "userId": uid},  # <-- scoped
                {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1, '_id': 1}
            )
        ]
        print(f"{len(jobs)} Jobs aus MongoDB abgerufen.")
        return jsonify(jobs)


@app.route('/reset_jobs', methods=['POST'])
@jwt_required()
def reset_jobs():
    uid = get_jwt_identity()
    res = collection.delete_many({"bookmark": False, "userId": uid})
    return jsonify({"deleted": res.deleted_count})


@app.route('/update_bookmark', methods=['POST'])
@jwt_required()
def update_bookmark():
    uid = get_jwt_identity()

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

    query['userId'] = uid  # nur eigene Jobs updaten

    result = collection.update_one(query, {'$set': {'bookmark': bookmark_status}})

    if result.matched_count != 1:
        return jsonify({'error': 'Job nicht gefunden.'}), 404

    return jsonify({'success': True})


@app.route('/bookmarked_jobs', methods=['GET'])
@jwt_required()
def get_bookmarked_jobs():
    uid = get_jwt_identity()

    jobs = list(
        collection.find(
            {"bookmark": True, "userId": uid},  # <-- scoped
            {'title': 1, 'company': 1, 'link': 1, 'bookmark': 1}
        )
    )
    for job in jobs:
        job['_id'] = str(job['_id'])
    print(f"{len(jobs)} bookmarked Jobs aus MongoDB abgerufen.")
    return jsonify(jobs)


@app.route('/save_search', methods=['POST'])
@jwt_required()
def save_search():
    uid = get_jwt_identity()

    data = request.json
    keywords = data.get('keywords', [])
    location = data.get('location', '')
    radius = int(data.get('radius', '30'))
    email = data.get('email', '')

    search_alerts_data = {
        "keywords": keywords,
        "location": location,
        "radius": radius,
        "email": email,
        'createdAt': datetime.now(UTC),
        'userId': uid,
    }
    result = search_alerts_collection.insert_one(search_alerts_data)
    search_alerts_data['_id'] = str(result.inserted_id)
    # optional: direkt initiale Ergebnisse holen & speichern
    try:
        execute_search_alerts()  # verarbeitet alle Alerts; minimal & genügt hier
    except Exception as e:
        print("Initialer Autoscan nach save_search fehlgeschlagen:", e)
    return jsonify({'success': True, 'search_alert': search_alerts_data})


@app.route('/search_alerts', methods=['GET'])
@jwt_required()
def get_search_alerts():
    uid = get_jwt_identity()

    search_alerts = list(
        search_alerts_collection.find(
            {"userId": uid},
            {'keywords': 1, 'location': 1, 'radius': 1, 'email': 1}
        )
    )
    for alert in search_alerts:
        alert['_id'] = str(alert['_id'])

    return jsonify(search_alerts)


@app.route('/delete_search_alert/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_search_alert(id):
    uid = get_jwt_identity()
    result = search_alerts_collection.delete_one({'_id': ObjectId(id), 'userId': uid})
    if result.deleted_count == 1:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Suchauftrag nicht gefunden'}), 404


scheduler = BackgroundScheduler()


def execute_search_alerts():
    # Job bekommt einen eigenen App-Kontext (z. B. wenn via Thread/Timer aufgerufen)
    with app.app_context():
        alerts = list(search_alerts_collection.find())
        print(f"[{datetime.now(UTC)}] Ausführung der gespeicherten Suchaufträge gestartet.")

        for alert in alerts:
            keywords = alert.get('keywords', [])
            location = alert.get('location', '')
            radius = int(alert.get('radius', 30))
            email = alert.get('email', '')

# --- Arbeitsagentur-Call (keine Normalisierung) ---
            try:
                # 4. Parameter explizit auf None -> Crawler speichert NICHT in 'collection'
                raw_jobs = crawl_arbeitsagentur(keywords, location, radius, None) or []
            except Exception as e:
                print(f"BAA-Crawl fehlgeschlagen für Alert {alert['_id']}: {e}")
                continue

            # Felder 1:1 übernehmen, nur Zuordnung + Timestamp setzen
            for job in raw_jobs:
                job['search_alert_id'] = str(alert['_id'])
                job['userId'] = alert.get('userId')
                job['timestamp'] = datetime.now(UTC)

            # Dedupe pro Alert – genau wie bei dir, nur mit get() falls 'link' fehlt
            existing_links = {
                d.get('link') for d in search_results_collection.find(
                    {'search_alert_id': str(alert['_id'])},
                    {'link': 1, '_id': 0}
                )
            }
            seen = set()
            unique_jobs = []
            for j in raw_jobs:
                lnk = (j.get('link') or "").strip()
                if not lnk:
                    continue  # leere Links nicht speichern (sonst knallt der Unique-Index)
                if lnk in existing_links or lnk in seen:
                    continue
                seen.add(lnk)
                unique_jobs.append(j)

            if unique_jobs:
                try:
                    search_results_collection.insert_many(unique_jobs, ordered=False)
                    print(f"{len(unique_jobs)} neue Ergebnisse für Suchauftrag {alert['_id']} gespeichert.")
                    # --- E-Mail-Benachrichtigung ---
                    if email:
                        try:
                            subject = f"[Night Crawler] {len(unique_jobs)} neue Jobs für deinen Alert"
                            # knapper Plaintext-Body: Titel – Firma – Quelle – Link (max 10 Zeilen)
                            lines = []
                            for j in unique_jobs[:10]:
                                title = j.get('title') or ''
                                company = j.get('company') or ''
                                source = j.get('source') or ''
                                link = j.get('link') or ''
                                lines.append(f"- {title} bei {company} ({source})\n  {link}")
                            more = len(unique_jobs) - len(lines)
                            if more > 0:
                                lines.append(f"... und {more} weitere. Öffne die App für alle Ergebnisse.")
                            body = (
                                f"Hallo,\n\n"
                                f"es gibt {len(unique_jobs)} neue Ergebnisse für deinen Suchauftrag:\n"
                                f"Keywords: {', '.join(keywords) or '-'} | Ort: {location or '-'} | Radius: {radius} km\n\n"
                                + "\n".join(lines) + "\n\n"
                                "— Dein Project Night Crawler"
                            )
                            send_email(email, subject, body)
                        except Exception as e:
                            print(f"E-Mail-Versand fehlgeschlagen für Alert {alert['_id']}: {e}")
                except Exception as e:
                    print(f"insert_many fehlgeschlagen für Alert {alert['_id']}: {e}")
            else:
                print(f"0 neue Ergebnisse für Suchauftrag {alert['_id']} (evtl. alles schon vorhanden).")


scheduler.add_job(execute_search_alerts, 'interval', hours=8)


def start_scheduler_once():
    # im echten Main-Prozess starten (nicht im Reloader)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        if not scheduler.running:
            scheduler.start()
            app.logger.info("APScheduler started")


start_scheduler_once()


@app.route('/get_search_results/<string:alert_id>', methods=['GET'])
@jwt_required()
def get_search_results(alert_id):
    uid = get_jwt_identity()
    results = list(
        search_results_collection.find({"search_alert_id": alert_id, "userId": uid})
    )
    for result in results:
        result['_id'] = str(result['_id'])
    return jsonify(results)


@app.route("/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    pw = data.get("password") or ""
    if not email or not pw:
        return jsonify({"error": "email/password required"}), 400
    if users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    res = users.insert_one({
        "email": email,
        "password": hash_password(pw),
        "emailVerified": False,
        "createdAt": datetime.now(UTC),
    })

    # Verifikationslink erzeugen (24h gültig)
    token = email_signer.dumps({"uid": str(res.inserted_id)}, salt="verify")
    verify_url = f"{PUBLIC_APP_URL}/verify-email?token={token}"

    send_email(email, "Verify your account", f"Klicke hier: {verify_url}")

    return jsonify({"ok": True})


@app.route("/auth/verify-email", methods=["POST"])
def verify_email():
    token = (request.json or {}).get("token")
    if not token:
        return jsonify({"error": "token required"}), 400
    try:
        data = email_signer.loads(token, salt="verify", max_age=60 * 60 * 24)
    except SignatureExpired:
        return jsonify({"error": "token expired"}), 400
    except BadSignature:
        return jsonify({"error": "invalid token"}), 400

    uid = data.get("uid")
    users.update_one({"_id": ObjectId(uid)}, {"$set": {"emailVerified": True}})
    return jsonify({"ok": True})


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    pw = data.get("password") or ""

    user = users.find_one({"email": email})
    if not user or not check_password(pw, user.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.get("emailVerified", False):
        return jsonify({"error": "email_not_verified"}), 403

    access, refresh = issue_tokens(user["_id"])
    return jsonify({"access": access, "refresh": refresh})


@app.route("/auth/request-password-reset", methods=["POST"])
def request_password_reset():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    user = users.find_one({"email": email})
    if not user:
        # Absichtlich generisch, damit Angreifer nicht erkennen ob Email existiert
        return jsonify({"ok": True})

    token = email_signer.dumps({"uid": str(user["_id"])}, salt="pw-reset")
    reset_url = f"{PUBLIC_APP_URL}/reset-password?token={token}"

    send_email(user["email"], "Reset your password", f"Klicke hier: {reset_url}")

    return jsonify({"ok": True})


@app.route("/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.json or {}
    token = data.get("token")
    new_pw = data.get("password")

    if not token or not new_pw:
        return jsonify({"error": "token_and_password_required"}), 400

    try:
        info = email_signer.loads(token, salt="pw-reset", max_age=3600)  # 1h gültig
    except Exception:
        return jsonify({"error": "invalid_or_expired"}), 400

    uid = info["uid"]
    hashed = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode()
    users.update_one({"_id": ObjectId(uid)}, {"$set": {"password": hashed}})

    return jsonify({"ok": True})


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return revoked.find_one({"jti": jti}) is not None


@app.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    exp_unix = get_jwt()["exp"]
    exp_dt = datetime.fromtimestamp(exp_unix, tz=timezone.utc)
    revoked.insert_one({"jti": jti, "exp": exp_unix, "exp_dt": exp_dt})
    return jsonify({"msg": "token revoked"})


print("Registrierte Routen:")
for rule in app.url_map.iter_rules():
    print(rule)

if __name__ == '__main__':  # Startet die Flask-App
    app.run(host='0.0.0.0', port=3050)
