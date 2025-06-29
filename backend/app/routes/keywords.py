from flask import Blueprint, request, jsonify
from app.services.keyword_service import load_keyword_favorites
from app.services.sorting_service import smart_sort

keywords_bp = Blueprint("keywords_bp", __name__)


@keywords_bp.route("/keyword_suggestions")
def get_keyword_suggestions():
    """Provides keyword suggestions based on usage frequency and recency."""
    query = request.args.get("q", "").lower()
    keywords_data = load_keyword_favorites()
    keywords_map = keywords_data.get("keywords", {})

    sorted_suggestions = smart_sort(keywords_map, query)

    return jsonify(sorted_suggestions[:10])
