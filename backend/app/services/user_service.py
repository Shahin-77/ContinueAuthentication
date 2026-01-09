from werkzeug.security import generate_password_hash, check_password_hash

# Mock DB (replace with Firebase later)
_USERS = {
    "student1": generate_password_hash("Password@123")
}

def authenticate_user(username: str, password: str) -> bool:
    if username not in _USERS:
        return False
    return check_password_hash(_USERS[username], password)
