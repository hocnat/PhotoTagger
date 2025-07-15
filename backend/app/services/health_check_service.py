import os
from app.services import exif_service
from app.services.rename_service import generate_filename_from_pattern


class HealthCheckService:
    def run_check(self, file_paths: list[str], rules: dict) -> list[dict]:
        """Runs a health check on a list of files against a set of rules."""
        if not file_paths:
            return []

        reports = []
        all_metadata = exif_service.read_metadata_for_files(file_paths)

        metadata_map = {
            os.path.basename(m.get("SourceFile", "")): m for m in all_metadata
        }

        for file_path in file_paths:
            filename = os.path.basename(file_path)
            metadata = metadata_map.get(filename)

            if not metadata:
                continue

            consolidation_check = self._check_consolidation(metadata)
            required_fields_check = self._check_required_fields(
                metadata, rules.get("required_fields", [])
            )
            filename_check = self._check_filename(
                filename, file_path, rules.get("rename_pattern", "")
            )

            reports.append(
                {
                    "filename": filename,
                    "checks": {
                        "consolidation": consolidation_check,
                        "requiredFields": required_fields_check,
                        "filename": filename_check,
                    },
                }
            )
        return reports

    def _check_consolidation(self, metadata: dict) -> dict:
        """Checks if all metadata fields are consolidated."""
        unconsolidated_fields = []
        for field_name, field_data in metadata.items():
            if (
                isinstance(field_data, dict)
                and field_data.get("isConsolidated") is False
            ):
                unconsolidated_fields.append(field_name)

        if not unconsolidated_fields:
            return {"status": "ok", "message": "All fields are consolidated."}
        else:
            return {
                "status": "error",
                "message": f"Fields not consolidated: {', '.join(unconsolidated_fields)}",
            }

    def _check_required_fields(
        self, metadata: dict, required_fields: list[str]
    ) -> dict:
        """Checks for the presence of mandatory fields."""
        missing_fields = []
        for field_name in required_fields:
            field = metadata.get(field_name)
            value = field.get("value") if field else None
            if value is None or (isinstance(value, (list, str)) and not value):
                missing_fields.append(field_name)

        if not missing_fields:
            return {"status": "ok", "message": "All required fields are present."}
        else:
            return {
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
            }

    def _check_filename(
        self, current_filename: str, file_path: str, pattern: str
    ) -> dict:
        """Checks if the current filename matches the pattern."""
        if not pattern:
            return {"status": "ok", "message": "No rename pattern configured."}

        current_base, _ = os.path.splitext(current_filename)

        expected_base, error = generate_filename_from_pattern(file_path, pattern)

        if error:
            return {"status": "error", "message": error}

        if current_base == expected_base:
            return {
                "status": "ok",
                "message": f"Filename '{current_filename}' conforms to the pattern.",
            }
        else:
            return {
                "status": "error",
                "message": f"Filename is '{current_base}', but pattern expects '{expected_base}'.",
            }


health_check_service = HealthCheckService()
