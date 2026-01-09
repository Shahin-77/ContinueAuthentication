from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

exam_bp = Blueprint("exam", __name__)

# =====================================================
# IN-MEMORY USER BASELINES (Prototype / Hackathon)
# =====================================================
USER_BASELINES = {}

# =====================================================
# QUESTIONS (DEMO DATA)
# =====================================================
QUESTIONS = [
    {"id": 1, "q": "2 + 2 = ?"},
    {"id": 2, "q": "Capital of India?"},
    {"id": 3, "q": "Which data structure follows FIFO?"},
    {"id": 4, "q": "What does HTTP stand for?"},
    {"id": 5, "q": "Which language is used for web styling?"},
    {"id": 6, "q": "What is the time complexity of binary search?"},
    {"id": 7, "q": "Which company developed Python?"},
    {"id": 8, "q": "What does SQL stand for?"},
    {"id": 9, "q": "Which protocol is used for secure web browsing?"},
    {"id": 10, "q": "What is the default port of HTTP?"}
]

# =====================================================
# PHASE 1 – FEATURE EXTRACTION
# =====================================================
def extract_keyboard_features(keystrokes):
    intervals = [k["value"] for k in keystrokes if k.get("type") == "interval"]
    avg_interval = sum(intervals) / len(intervals) if intervals else 0
    return round(avg_interval, 2)

def extract_mouse_features(mouse):
    speeds = [m["speed"] for m in mouse if m.get("type") == "move"]
    avg_speed = sum(speeds) / len(speeds) if speeds else 0
    clicks = sum(1 for m in mouse if m.get("type") == "click")
    return round(avg_speed, 4), clicks

# =====================================================
# TRUST SCORE CALCULATION
# =====================================================
def similarity_trust(baseline, current):
    if baseline == 0:
        return 100
    deviation = abs(baseline - current) / baseline
    return max(0, round(100 - deviation * 100, 2))

def consistency_trust(keystrokes, mouse):
    noise_score = len(keystrokes) * 0.1 + len(mouse) * 0.05
    return max(0, round(100 - min(noise_score, 40), 2))

# =====================================================
# ACTION DECISION LOGIC
# =====================================================
def decide_action(trust):
    if trust >= 80:
        return "allow"
    elif trust >= 50:
        return "warn"
    elif trust >= 30:
        return "reauth"
    else:
        return "logout"

# =====================================================
# GET QUESTIONS API
# =====================================================
@exam_bp.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    user = get_jwt_identity()
    return jsonify({
        "candidate": user,
        "duration": 600,
        "questions": QUESTIONS
    }), 200

# =====================================================
# RECEIVE BEHAVIOR & EVALUATE TRUST
# =====================================================
@exam_bp.route("/keystrokes", methods=["POST"])
@jwt_required()
def receive_behavior():
    payload = request.get_json(silent=True) or {}
    user = get_jwt_identity()

    keystrokes = payload.get("keystrokes", [])
    mouse = payload.get("mouse", [])

    # -------- Feature Extraction --------
    avg_typing = extract_keyboard_features(keystrokes)
    avg_mouse_speed, click_count = extract_mouse_features(mouse)

    current_features = {
        "typing_interval": avg_typing,
        "mouse_speed": avg_mouse_speed,
        "click_count": click_count
    }

    baseline = USER_BASELINES.get(user)

    # -------- First Session (Baseline Creation) --------
    if not baseline:
        USER_BASELINES[user] = current_features
        print(f"[BASELINE CREATED] {user} → {current_features}")

        return jsonify({
            "status": "baseline_created",
            "final_trust": 100,
            "action": "allow"
        }), 200

    # -------- Trust Computation --------
    typing_score = similarity_trust(
        baseline["typing_interval"],
        current_features["typing_interval"]
    )

    mouse_score = similarity_trust(
        baseline["mouse_speed"],
        current_features["mouse_speed"]
    )

    consistency_score = consistency_trust(keystrokes, mouse)

    final_trust = round(
        typing_score * 0.4 +
        mouse_score * 0.4 +
        consistency_score * 0.2,
        2
    )

    action = decide_action(final_trust)

    print("\n====== CONTINUOUS AUTH CHECK ======")
    print("User:", user)
    print("Typing Trust:", typing_score)
    print("Mouse Trust:", mouse_score)
    print("Consistency:", consistency_score)
    print("Final Trust:", final_trust)
    print("Action:", action)
    print("=================================\n")

    return jsonify({
        "status": "trust_evaluated",
        "typing_trust": typing_score,
        "mouse_trust": mouse_score,
        "consistency_trust": consistency_score,
        "final_trust": final_trust,
        "action": action
    }), 200   