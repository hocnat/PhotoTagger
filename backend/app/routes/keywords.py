from flask import Blueprint, request, jsonify
from app.services.keyword_service import keyword_service
from app.services.sorting_service import smart_sort

keywords_bp = Blueprint("keywords_bp", __name__)


@keywords_bp.route("/keywords/suggestions")
def get_keyword_suggestions():
    """Provides keyword suggestions based on usage frequency and recency."""
    query = request.args.get("q", "").lower()
    all_keywords = keyword_service.get_all()

    # The smart_sort function expects a dictionary of {name: {usageCount, lastUsed}}.
    # We build this on the fly from our new keyword structure.
    # This allows a single keyword object to be found by its name or any synonym.
    keywords_map = {}
    for kw_obj in all_keywords:
        usage_data = {
            "usageCount": kw_obj.get("useCount", 0),
            "lastUsed": kw_obj.get("lastUsed"),
        }
        # Add the primary name
        keywords_map[kw_obj["name"]] = usage_data
        # Add all synonyms
        for synonym in kw_obj.get("data", {}).get("synonyms", []):
            keywords_map[synonym] = usage_data

    sorted_suggestions = smart_sort(keywords_map, query)

    return jsonify(sorted_suggestions[:10])


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
