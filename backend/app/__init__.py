from flask import Flask
from flask_cors import CORS


def create_app():
    """Application factory function."""
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"] = False

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

    # Import and register blueprints
    from .routes.files import files_bp
    from .routes.metadata import metadata_bp
    from .routes.tools import tools_bp

    app.register_blueprint(files_bp, url_prefix="/api")
    app.register_blueprint(metadata_bp, url_prefix="/api")
    app.register_blueprint(tools_bp, url_prefix="/api")

    return app
