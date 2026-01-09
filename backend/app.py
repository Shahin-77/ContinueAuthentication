from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from model import BehaviorModel

app = Flask(__name__)
CORS(app)

model = BehaviorModel()
training_data = []

@app.route("/login", methods=["POST"])
def login():
    global training_data
    training_data = []
    model.trained = False
    return jsonify({"message": "Login successful. Training started."})

@app.route("/behavior", methods=["POST"])
def behavior():
    global training_data

    data = request.json
    features = [
        data["avg_key_delay"],
        data["key_delay_std"],
        data["mouse_speed"],
        data["mouse_randomness"]
    ]

    if not model.trained:
        training_data.append(features)
        if len(training_data) >= 20:
            model.train(np.array(training_data))
        return jsonify({"risk": 0.0, "status": "training"})

    risk = model.predict_risk(features)

    # 🔥 TRUST BUBBLE LOGIC
    if risk < 0.4:
        state = "FULL_ACCESS"
    elif risk < 0.7:
        state = "RESTRICTED"
    else:
        state = "LOCKED"

    return jsonify({
        "risk": round(risk, 2),
        "state": state
    })

if __name__ == "__main__":
    app.run(debug=True)
