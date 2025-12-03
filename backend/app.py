# app.py
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import errors
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import re
import math
load_dotenv()
from datetime import datetime, timezone

# Haversine distance (km)
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (math.sin(dphi/2)**2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "ev_app")
DB_PORT = int(os.getenv("DB_PORT", 3306))
# Scoring tunables
SPEED_LIMIT_KPH = float(os.getenv("SPEED_LIMIT_KPH", 100.0))  # threshold for "speeding events"
HARSH_ACCEL_THRESHOLD = float(os.getenv("HARSH_ACCEL_MPS2", 3.0))  # m/s^2 for harsh accel/brake
PENALTY_HARSH_ACCEL = float(os.getenv("PENALTY_HARSH_ACCEL", 5.0))  # points per harsh accel
PENALTY_HARSH_BRAKE = float(os.getenv("PENALTY_HARSH_BRAKE", 7.0))  # points per harsh braking
PENALTY_SPEEDING = float(os.getenv("PENALTY_SPEEDING", 2.0))        # points per speeding event
MIN_SCORE = 0
MAX_SCORE = 100

def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        port=DB_PORT,
        auth_plugin="mysql_native_password"
    )

app = Flask(__name__)
CORS(app)  # Allow requests from your mobile app (for development)

# basic validation helpers
def is_valid_email(email: str) -> bool:
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))

def is_valid_phone(phone: str) -> bool:
    # very permissive; adjust for your format
    return bool(re.match(r"^[0-9+\-\s()]*$", phone))

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    # validation
    if not username or not email or not password:
        return jsonify({"message": "username, email and password are required"}), 400

    if not is_valid_email(email):
        return jsonify({"message": "invalid email"}), 400

    if phone and not is_valid_phone(phone):
        return jsonify({"message": "invalid phone number"}), 400

    if len(password) < 6:
        return jsonify({"message": "password must be at least 6 characters"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # check if username or email exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return jsonify({"message": "username or email already exists"}), 409

        # hash password (werkzeug uses PBKDF2)
        password_hash = generate_password_hash(password)

        cursor.execute(
            "INSERT INTO users (username, email, phone, password_hash) VALUES (%s, %s, %s, %s)",
            (username, email, phone, password_hash),
        )
        conn.commit()

        user_id = cursor.lastrowid
        cursor.close()
        conn.close()

        return jsonify({"message": "account created", "user_id": user_id}), 201

    except errors.InterfaceError as e:
        app.logger.exception("Database connection failed")
        return jsonify({"message": "database connection failed", "error": str(e)}), 500
    except Exception as e:
        app.logger.exception("Unexpected error")
        return jsonify({"message": "internal server error", "error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "Email not found"}), 404

        #Hashed pw
        if not check_password_hash(user["password_hash"], password):
            return jsonify({"message": "Wrong password"}), 401

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }), 200

    except Exception as e:
        print("Login error:", e)
        return jsonify({"message": "Internal server error"}), 500



@app.route("/trip/start", methods=["POST"])
def start_trip():
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"message": "Missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        now = datetime.now()

        cursor.execute("""
            INSERT INTO trips (driverID, startTime, distance, avgSpeed)
            VALUES (%s, %s, 0, 0)
        """, (user_id, now))
        conn.commit()

        trip_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({"message": "Trip started", "tripID": trip_id}), 200

    except Exception as e:
        return jsonify({"message": "Failed to start trip", "error": str(e)}), 500

@app.route("/sensor", methods=["POST"])
def save_sensor_data():
    data = request.get_json() or {}
    tripID = data.get("tripID")
    speed = data.get("speed")
    acceleration = data.get("acceleration")
    lat = data.get("latitude")
    lon = data.get("longitude")

    if not tripID:
        return jsonify({"message": "Missing tripID"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        now =datetime.now()

        cursor.execute("""
            INSERT INTO sensor_data (tripID, speed, acceleration, latitude, longitude, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (tripID, speed, acceleration, lat, lon, now))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"status": "ok"}), 200

    except Exception as e:
        return jsonify({"message": "Failed to save sensor data", "error": str(e)}), 500

@app.route("/trip/end", methods=["POST"])
def end_trip():
    data = request.get_json() or {}
    tripID = data.get("tripID")

    if not tripID:
        return jsonify({"message": "Missing tripID"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Load all sensor points
        cursor.execute("""
            SELECT latitude, longitude, speed, timestamp
            FROM sensor_data
            WHERE tripID = %s
            ORDER BY timestamp ASC
        """, (tripID,))

        rows = cursor.fetchall()
        if len(rows) < 2:
            return jsonify({"message": "Not enough data to compute trip stats"}), 200

        # 2. Distance
        total_km = 0
        last = rows[0]
        for row in rows[1:]:
            total_km += haversine_km(
                last["latitude"], last["longitude"],
                row["latitude"], row["longitude"]
            )
            last = row

        # 3. Duration + average speed
        start_time = rows[0]["timestamp"].replace(tzinfo=None)
        end_time = rows[-1]["timestamp"].replace(tzinfo=None)
        
        if end_time <= start_time:
        # fallback in case of clock issues
            end_time = datetime.now()
        elapsed_hours = (end_time - start_time).total_seconds() / 3600
        avg_speed = (total_km / elapsed_hours) if elapsed_hours > 0 else 0

        # 4. Save to trips table
        cursor.execute("""
            UPDATE trips
            SET endTime = %s, distance = %s, avgSpeed = %s
            WHERE tripID = %s
        """, (end_time, total_km, avg_speed, tripID))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Trip ended",
            "distance_km": round(total_km, 2),
            "avg_speed": round(avg_speed, 2)
        }), 200

    except Exception as e:
        return jsonify({"message": "Failed to end trip", "error": str(e)}), 500

@app.route("/driver/score/<int:tripID>")
def driver_score(tripID):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT speed, acceleration FROM sensor_data
            WHERE tripID = %s
        """, (tripID,))
        data = cursor.fetchall()

        if not data:
            return jsonify({"message": "No sensor data found"}), 404

        score = 100
        speeding_events = 0
        harsh_accels = 0
        harsh_brakes = 0

        for row in data:
            speed = row["speed"] or 0
            accel = row["acceleration"] or 0

            if speed > SPEED_LIMIT_KPH:
                score -= PENALTY_SPEEDING
                speeding_events += 1

            if accel > HARSH_ACCEL_THRESHOLD:
                score -= PENALTY_HARSH_ACCEL
                harsh_accels += 1

            if accel < -HARSH_ACCEL_THRESHOLD:
                score -= PENALTY_HARSH_BRAKE
                harsh_brakes += 1

        score = max(MIN_SCORE, min(MAX_SCORE, int(score)))

        cursor.execute("""
            INSERT INTO driver_scores (tripID, totalScore, riskLevel, suggestion)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                totalScore = VALUES(totalScore),
                riskLevel = VALUES(riskLevel),
                suggestion = VALUES(suggestion)
        """, (
            tripID,
            score,
            "High" if score < 40 else "Medium" if score < 80 else "Low",
            f"Speeding events: {speeding_events}, Harsh accels: {harsh_accels}, Harsh brakes: {harsh_brakes}"
        ))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"score": score})

    except Exception as e:
        return jsonify({"message": "Error calculating driver score", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)