from datetime import datetime, timedelta, timezone
from app.services.settings_service import get_setting


def smart_sort(items_map: dict, query: str) -> list:
    """
    Filters a dictionary of items by a query string and then sorts them
    intelligently based on a score combining usage count and recency.

    Args:
        items_map: A dictionary where keys are the item names (e.g., keywords)
                   and values are dictionaries containing 'usageCount' and 'lastUsed'.
        query: The search string to filter by.

    Returns:
        A sorted list of item names (the keys of the input map).
    """
    recency_bonus = get_setting("powerUser.sorting.recencyBonus", 100)
    recency_days = get_setting("powerUser.sorting.recencyDays", 7)

    now = datetime.now(timezone.utc)
    recency_threshold = now - timedelta(days=recency_days)

    # 1. Filter the items based on the query.
    filtered_items = {
        key: data for key, data in items_map.items() if query in key.lower()
    }

    # 2. Score each filtered item.
    def calculate_score(item_data: dict) -> int:
        base_score = item_data.get("usageCount", 0)
        last_used_str = item_data.get("lastUsed")

        bonus = 0
        if last_used_str:
            try:
                # The 'Z' at the end of an ISO 8601 string signifies UTC,
                # which fromisoformat can handle directly in Python 3.11+.
                # For compatibility, we'll handle it manually.
                if last_used_str.endswith("Z"):
                    last_used_str = last_used_str[:-1] + "+00:00"
                last_used_date = datetime.fromisoformat(last_used_str)

                if last_used_date > recency_threshold:
                    bonus = recency_bonus
            except (ValueError, TypeError):
                # Handle cases where lastUsed is not a valid date string.
                pass

        return base_score + bonus

    # 3. Sort the filtered items by their calculated score.
    sorted_keys = sorted(
        filtered_items.keys(),
        key=lambda k: calculate_score(filtered_items[k]),
        reverse=True,
    )

    return sorted_keys
