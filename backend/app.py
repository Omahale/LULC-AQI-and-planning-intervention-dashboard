import os
from datetime import timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import check_password_hash, generate_password_hash

from services import ee_service, aqi_service, prediction_service

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(BACKEND_DIR, "..", ".env"))

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

jwt = JWTManager(app)
frontends = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:4173",
)
allowed_origins = [origin.strip() for origin in frontends.split(",") if origin.strip()]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

ROLE_PERMISSIONS = {
    "citizen": ["/", "/map", "/aqi", "/lulc", "/hotspots", "/trends", "/about"],
    "engineer": ["/", "/map", "/aqi", "/lulc", "/reports", "/about"],
    "admin": ["/", "/map", "/aqi", "/lulc", "/hotspots", "/prediction", "/trends", "/alerts", "/reports", "/about"],
}
VALID_ROLES = set(ROLE_PERMISSIONS.keys())

USERS = {
    "citizen": {
        "username": "citizen",
        "password": "citizen123",
        "name": "Citizen User",
        "role": "citizen",
        "permissions": ROLE_PERMISSIONS["citizen"],
    },
    "engineer": {
        "username": "engineer",
        "password": "engineer123",
        "name": "Planning Engineer",
        "role": "engineer",
        "permissions": ROLE_PERMISSIONS["engineer"],
    },
    "admin": {
        "username": "admin",
        "password": "admin123",
        "name": "Environmental Admin",
        "role": "admin",
        "permissions": ROLE_PERMISSIONS["admin"],
    },
}

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/lulc_aqi")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", MONGO_URI.rsplit("/", 1)[-1].split("?")[0] or "lulc_aqi")

mongo_client = None
try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    mongo_client.admin.command("ping")
    print(f"[MongoDB] Connected to {MONGO_URI}")
except Exception as exc:  # pragma: no cover - runtime environment dependency
    print(f"[MongoDB] Connection unavailable: {exc}")
    print("[MongoDB] Falling back to in-memory user storage until MongoDB is running.")


def get_users_collection():
    if mongo_client is None:
        return None
    db = mongo_client[MONGO_DB_NAME]
    return db["users"]


def normalize_role(role):
    role_name = (role or "").strip().lower()
    return role_name if role_name in VALID_ROLES else "citizen"


def user_permissions_for_role(role):
    return ROLE_PERMISSIONS.get(normalize_role(role), ROLE_PERMISSIONS["citizen"])


def build_user_document(payload):
    username = (payload.get("username") or "").strip()
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    role = normalize_role(payload.get("role"))

    if not username or not name or not email or not password:
        raise ValueError("username, name, email, and password are required")

    return {
        "username": username,
        "email": email,
        "password": generate_password_hash(password, method="pbkdf2:sha256"),
        "name": name,
        "role": role,
        "permissions": user_permissions_for_role(role),
        "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "updated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    }


def verify_password(stored_password, candidate_password):
    if not stored_password:
        return False

    if stored_password == candidate_password:
        return True

    try:
        return check_password_hash(stored_password, candidate_password)
    except ValueError:
        return False


def ensure_default_users():
    collection = get_users_collection()
    if collection is None:
        return

    try:
        for username, user in USERS.items():
            existing = collection.find_one({"username": username})
            if existing is None:
                collection.insert_one({
                    "username": user["username"],
                    "password": generate_password_hash(user["password"], method="pbkdf2:sha256"),
                    "name": user["name"],
                    "role": user["role"],
                    "permissions": user["permissions"],
                    "email": f"{user['username']}@example.com",
                    "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                    "updated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                })
            else:
                collection.update_one(
                    {"username": username},
                    {"$set": {
                        "password": generate_password_hash(user["password"], method="pbkdf2:sha256"),
                        "name": user["name"],
                        "role": user["role"],
                        "permissions": user["permissions"],
                        "email": f"{user['username']}@example.com",
                        "updated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                    }},
                )
    except Exception as exc:  # pragma: no cover - runtime environment dependency
        print(f"[MongoDB] Seed fallback skipped: {exc}")


def fetch_user(username):
    collection = get_users_collection()
    if collection is not None:
        try:
            user = collection.find_one({"username": username})
            if user:
                user.pop("_id", None)
                return user
        except Exception as exc:  # pragma: no cover - runtime environment dependency
            print(f"[MongoDB] Query fallback used: {exc}")

    fallback = USERS.get(username)
    if fallback:
        return {
            "username": fallback["username"],
            "password": fallback["password"],
            "name": fallback["name"],
            "role": fallback["role"],
            "permissions": fallback["permissions"],
        }
    return None


def save_user_record(user_doc):
    collection = get_users_collection()
    if collection is not None:
        try:
            collection.insert_one(user_doc)
            return True
        except Exception as exc:  # pragma: no cover - runtime environment dependency
            print(f"[MongoDB] Save fallback used: {exc}")

    USERS[user_doc["username"]] = {
        "username": user_doc["username"],
        "password": user_doc["password"],
        "name": user_doc["name"],
        "role": user_doc["role"],
        "permissions": user_doc["permissions"],
    }
    return True


ensure_default_users()


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    user = fetch_user(username)
    if not user or not verify_password(user["password"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_access_token(identity=username)

    return jsonify(
        {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "username": username,
                "name": user["name"],
                "role": user["role"],
                "permissions": user.get("permissions", ROLE_PERMISSIONS.get(user["role"], [])),
            },
        }
    )


@app.get("/api/auth/me")
@jwt_required()
def auth_me():
    username = get_jwt_identity()
    user = fetch_user(username)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(
        {
            "username": username,
            "name": user["name"],
            "role": user["role"],
            "permissions": user.get("permissions", ROLE_PERMISSIONS.get(user["role"], [])),
        }
    )


@app.post("/api/auth/register")
def register():
    payload = request.get_json(silent=True) or {}

    try:
        user_doc = build_user_document(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    normalized_username = user_doc["username"]
    normalized_email = user_doc["email"]

    for existing_user in USERS.values():
        if existing_user["username"].lower() == normalized_username.lower():
            return jsonify({"error": "Username already exists"}), 409
        if existing_user.get("email", "").lower() == normalized_email.lower():
            return jsonify({"error": "Email already exists"}), 409

    collection = get_users_collection()
    if collection is not None:
        try:
            if collection.find_one({"username": normalized_username}):
                return jsonify({"error": "Username already exists"}), 409
            if collection.find_one({"email": normalized_email}):
                return jsonify({"error": "Email already exists"}), 409
            collection.insert_one(user_doc)
        except Exception as exc:  # pragma: no cover - runtime environment dependency
            print(f"[MongoDB] Registration fallback used: {exc}")
            save_user_record(user_doc)
    else:
        save_user_record(user_doc)

    token = create_access_token(identity=normalized_username)
    return jsonify(
        {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "username": normalized_username,
                "name": user_doc["name"],
                "role": user_doc["role"],
                "permissions": user_doc["permissions"],
            },
        }
    ), 201


# ---------------- LULC ----------------
@app.get("/api/lulc/tile-url")
@jwt_required(optional=True)
def lulc_tile_url():
    return jsonify(ee_service.get_lulc_tile_url())


@app.get("/api/lulc/stats")
@app.get("/api/lulc/summary")
@jwt_required(optional=True)
def lulc_stats():
    return jsonify(ee_service.get_area_stats())


@app.get("/api/lulc/area-stats")
@jwt_required(optional=True)
def lulc_area_stats():
    return jsonify(ee_service.get_area_stats())


@app.get("/api/lulc/accuracy")
@jwt_required(optional=True)
def lulc_accuracy():
    return jsonify(ee_service.get_accuracy_stats())


# ---------------- AQI ----------------
@app.get("/api/aqi/current")
@jwt_required(optional=True)
def aqi_current():
    return jsonify(aqi_service.get_current_aqi())


@app.get("/api/aqi/areas")
@app.get("/api/aqi/area-summary")
@app.get("/api/aqi/area-breakdown")
@jwt_required(optional=True)
def aqi_areas():
    return jsonify(aqi_service.get_area_breakdown())


@app.get("/api/aqi/trend")
@jwt_required(optional=True)
def aqi_trend():
    period = request.args.get("period")
    station = request.args.get("station")
    pollutant = request.args.get("pollutant")
    year = request.args.get("year")
    days = request.args.get("days", type=int)
    return jsonify(aqi_service.get_aqi_trend(period=period, station=station, pollutant=pollutant, year=year, days=days))


@app.get("/api/aqi/historical")
@jwt_required(optional=True)
def aqi_historical():
    return jsonify(aqi_service.get_historical_summary())


@app.get("/api/aqi/hotspots")
@jwt_required(optional=True)
def aqi_hotspots():
    return jsonify(aqi_service.get_hotspots())


# ---------------- NMC Boundary ----------------
@app.get("/api/boundary/nmc")
def nmc_boundary():
    geojson_path = os.path.join(BACKEND_DIR, "..", "src", "data", "nmc_boundary.geojson")
    if os.path.exists(geojson_path):
        import json
        with open(geojson_path, "r") as f:
            return jsonify(json.load(f))
    return jsonify({"error": "NMC Boundary GeoJSON not found"}), 404


# ---------------- Prediction ----------------
@app.get("/api/prediction")
@jwt_required(optional=True)
def prediction():
    return jsonify(prediction_service.get_forecast())


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
