from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.services.user_service import authenticate_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Invalid request"}), 400

    if not authenticate_user(data["username"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=data["username"])

    return jsonify({
        "access_token": token,
        "message": "Login successful"
    }), 200
