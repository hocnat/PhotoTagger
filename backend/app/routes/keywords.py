from flask import Blueprint, request, jsonify
from app.services.keyword_service import keyword_service

keywords_bp = Blueprint("keywords_bp", __name__)


@keywords_bp.route("/keywords/suggestions")
def get_keyword_suggestions():
    """Provides rich keyword suggestions including parent/synonym info."""
    query = request.args.get("q", "").lower()
    suggestions = keyword_service.get_suggestions(query)

    return jsonify(suggestions)


@keywords_bp.route("/keywords", methods=["GET"])
def get_keywords():
    """
    Get all managed keywords.
    """
    keywords = keyword_service.get_all()
    return jsonify(keywords)


@keywords_bp.route("/keywords", methods=["POST"])
def add_keyword():
    """
    Add a new keyword.
    Expects JSON: {"name": "KeywordName", "data": {"parent": "parent_id", "synonyms": ["syn1"]}}
    """
    data = request.get_json()
    if not data or "name" not in data or "data" not in data:
        return jsonify({"error": "Missing required fields: name and data"}), 400

    name = data.get("name")
    keyword_data = data.get("data", {})

    new_keyword = keyword_service.add(name, keyword_data)
    return jsonify(new_keyword), 201


@keywords_bp.route("/keywords/<string:keyword_id>", methods=["PUT"])
def update_keyword(keyword_id):
    """
    Update an existing keyword.
    Expects JSON: {"name": "NewName", "data": {"parent": "new_parent_id", "synonyms": ["new_syn"]}}
    """
    updates = request.get_json()
    if not updates:
        return jsonify({"error": "Invalid request body"}), 400

    updated_keyword = keyword_service.update(keyword_id, updates)
    if updated_keyword:
        return jsonify(updated_keyword)

    return jsonify({"error": "Keyword not found"}), 404


@keywords_bp.route("/keywords/<string:keyword_id>", methods=["DELETE"])
def delete_keyword(keyword_id):
    """
    Delete a keyword.
    """
    if keyword_service.delete(keyword_id):
        return jsonify({"message": "Keyword deleted successfully"}), 200

    return jsonify({"error": "Keyword not found"}), 404
