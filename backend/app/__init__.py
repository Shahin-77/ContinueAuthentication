from flask import Flask
from .config import Config
from .extensions import cors, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    cors.init_app(app)
    jwt.init_app(app)

    from .routes.auth import auth_bp
    from .routes.exam import exam_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(exam_bp, url_prefix="/api/exam")

    return app
