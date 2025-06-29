from flask import Blueprint, request, jsonify
from app.services.keyword_service import (
    load_keyword_favorites,
)

keywords_bp = Blueprint("keywords_bp", __name__)


@keywords_bp.route("/keyword_suggestions")
def get_keyword_suggestions():
    """Provides keyword suggestions based on usage frequency and recency."""
    query = request.args.get("q", "").lower()
    keywords_data = load_keyword_favorites()
    keywords_map = keywords_data.get("keywords", {})

    if not query:
        # If the query is empty, suggest the most recently used keywords.
        suggestions = sorted(
            keywords_map,
            key=lambda k: keywords_map[k].get("lastUsed", ""),
            reverse=True,
        )
        return jsonify(suggestions[:10])

    # Otherwise, return keywords that start with the query string.
    return jsonify([k for k in keywords_map if k.lower().startswith(query)])
