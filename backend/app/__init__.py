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
    from .routes.keywords import keywords_bp
    from .routes.locations import locations_bp
    from .routes.metadata import metadata_bp
    from .routes.rename import rename_bp
    from .routes.settings import settings_bp
    from .routes.location_importer import location_importer_bp
    from .routes.health_check import health_check_bp
    from .routes.time import time_bp
    from .routes.geotagging import geotagging_bp

    app.register_blueprint(files_bp, url_prefix="/api")
    app.register_blueprint(keywords_bp, url_prefix="/api")
    app.register_blueprint(locations_bp, url_prefix="/api")
    app.register_blueprint(metadata_bp, url_prefix="/api")
    app.register_blueprint(rename_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")
    app.register_blueprint(location_importer_bp, url_prefix="/api")
    app.register_blueprint(health_check_bp, url_prefix="/api")
    app.register_blueprint(time_bp, url_prefix="/api")
    app.register_blueprint(geotagging_bp, url_prefix="/api")

    return app